CREATE OR REPLACE FUNCTION public.prevent_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  -- Service role (server-side operations): auth.uid() is NULL
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only admin can change user status'
    USING ERRCODE = 'insufficient_privilege';
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role = OLD.role THEN
    RETURN NEW;
  END IF;

  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'Only admin can change user roles'
    USING ERRCODE = 'insufficient_privilege';
END;
$function$;
