-- Check if chat_messages table exists and has data
SELECT * FROM public.chat_messages LIMIT 10;

-- Check if RLS is blocking inserts
SELECT * FROM pg_policies WHERE tablename = 'chat_messages';
