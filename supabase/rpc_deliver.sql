-- ==============================================================================
-- الدالة المعاملاتية الذرية لتسليم المساعدات (Atomic Transaction RPC)
-- يتم تنفيذ جميع العمليات داخل معاملة واحدة آمنة تمنع التضارب والصرف المتكرر
-- ==============================================================================

CREATE OR REPLACE FUNCTION process_charity_delivery(
  p_code VARCHAR(6),
  p_current_month VARCHAR(7),
  p_staff_id UUID,
  p_staff_name TEXT,
  p_items JSONB,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_rec RECORD;
  v_beneficiary_rec RECORD;
  v_total_points INT := 0;
  v_balance_before INT;
  v_balance_after INT;
  v_delivery_id UUID;
  v_item JSONB;
  v_item_prod_id UUID;
  v_item_name TEXT;
  v_item_points INT;
  v_item_qty INT;
  v_item_subtotal INT;
BEGIN
  -- 1. قفل وسحب سجل الكود لمنع أي تضارب متزامن (FOR UPDATE)
  SELECT id, beneficiary_id, month_key, status
  INTO v_code_rec
  FROM monthly_codes
  WHERE code = p_code
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'كود الاستلام غير صحيح أو غير مسجل بالمنظومة';
  END IF;

  IF v_code_rec.month_key <> p_current_month THEN
    RAISE EXCEPTION 'كود الاستلام غير مخصص للشهر الحالي (%) بل لشهر (%)', p_current_month, v_code_rec.month_key;
  END IF;

  IF v_code_rec.status <> 'available' THEN
    RAISE EXCEPTION 'تم صرف المساعدة بهذا الكود مسبقاً ولا يمكن استخدامه مجدداً';
  END IF;

  -- 2. قفل وسحب سجل المستفيد (FOR UPDATE)
  SELECT id, full_name, points_balance, is_active
  INTO v_beneficiary_rec
  FROM beneficiaries
  WHERE id = v_code_rec.beneficiary_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'سجل المستفيد غير موجود بالمنظومة';
  END IF;

  IF NOT v_beneficiary_rec.is_active THEN
    RAISE EXCEPTION 'حساب المستفيد معطل حالياً';
  END IF;

  v_balance_before := v_beneficiary_rec.points_balance;

  -- 3. حساب إجمالي نقاط السلة والتحقق من سلامة البيانات
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_qty := (v_item->>'quantity')::INT;
    v_item_points := (v_item->>'pointsCost')::INT;
    v_item_subtotal := v_item_qty * v_item_points;
    v_total_points := v_total_points + v_item_subtotal;
  END LOOP;

  IF v_total_points <= 0 THEN
    RAISE EXCEPTION 'يجب اختيار سلع تحتوي على نقاط لتنفيذ عملية الصرف';
  END IF;

  IF v_balance_before < v_total_points THEN
    RAISE EXCEPTION 'رصيد نقاط المستفيد غير كافٍ. المطلوب: % نقطة، المتوفر: % نقطة', v_total_points, v_balance_before;
  END IF;

  v_balance_after := v_balance_before - v_total_points;

  -- 4. إدراج سجل التسليم الرئيسي (Deliveries)
  INSERT INTO deliveries (
    code_id,
    beneficiary_id,
    staff_id,
    total_points,
    balance_before,
    balance_after,
    notes
  ) VALUES (
    v_code_rec.id,
    v_beneficiary_rec.id,
    p_staff_id,
    v_total_points,
    v_balance_before,
    v_balance_after,
    p_notes
  )
  RETURNING id INTO v_delivery_id;

  -- 5. إدراج أصناف السلة في تفاصيل التسليم (Delivery Items)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_prod_id := (v_item->>'productId')::UUID;
    v_item_name := v_item->>'productName';
    v_item_qty := (v_item->>'quantity')::INT;
    v_item_points := (v_item->>'pointsCost')::INT;
    v_item_subtotal := v_item_qty * v_item_points;

    INSERT INTO delivery_items (
      delivery_id,
      product_id,
      product_name,
      unit_points,
      quantity,
      subtotal_points
    ) VALUES (
      v_delivery_id,
      v_item_prod_id,
      v_item_name,
      v_item_points,
      v_item_qty,
      v_item_subtotal
    );
  END LOOP;

  -- 6. خصم النقاط من رصيد المستفيد وتحديث تاريخ التعديل
  UPDATE beneficiaries
  SET points_balance = v_balance_after,
      updated_at = timezone('utc'::text, now())
  WHERE id = v_beneficiary_rec.id;

  -- 7. تحديث حالة الكود الشهري إلى "تم الصرف"
  UPDATE monthly_codes
  SET status = 'used',
      used_at = timezone('utc'::text, now()),
      used_by_staff_id = p_staff_id,
      delivery_id = v_delivery_id
  WHERE id = v_code_rec.id;

  -- 8. تسجيل العملية في سجل التدقيق الأمني (Audit Logs)
  INSERT INTO audit_logs (
    action,
    actor_id,
    actor_name,
    actor_role,
    target_id,
    target_name,
    details
  ) VALUES (
    'DELIVERY_DISPATCH',
    p_staff_id,
    p_staff_name,
    'staff',
    v_beneficiary_rec.id::TEXT,
    v_beneficiary_rec.full_name,
    format('صرف سلع تموينية بإجمالي %s نقطة للمستفيد %s بكود %s. الرصيد المتبقي: %s',
           v_total_points, v_beneficiary_rec.full_name, p_code, v_balance_after)
  );

  -- 9. إرجاع النتيجة بنجاح
  RETURN jsonb_build_object(
    'success', true,
    'delivery_id', v_delivery_id,
    'total_points', v_total_points,
    'balance_before', v_balance_before,
    'balance_after', v_balance_after,
    'beneficiary_name', v_beneficiary_rec.full_name,
    'created_at', timezone('utc'::text, now())
  );
END;
$$;
