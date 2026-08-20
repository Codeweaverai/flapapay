BEGIN;

ALTER TABLE public.webhook_delivery_logs
    ADD COLUMN IF NOT EXISTS environment_id UUID;

UPDATE public.webhook_delivery_logs l
SET environment_id = w.environment_id
FROM public.webhooks w
WHERE w.id = l.webhook_id
  AND l.environment_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_delivery_logs_environment
    ON public.webhook_delivery_logs (merchant_id, environment_id, created_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'webhook_delivery_logs_environment_fk'
    ) THEN
        ALTER TABLE public.webhook_delivery_logs
            ADD CONSTRAINT webhook_delivery_logs_environment_fk
            FOREIGN KEY (environment_id)
            REFERENCES public.merchant_environments(id)
            NOT VALID;
    END IF;
END $$;

COMMIT;
