insert into public.events (slug, title, description, event_date)
values ('deepfakes-digital-trust-2026', 'Deepfakes and Digital Trust', 'Recognizing AI-Generated Media and Misinformation', '2026-10-18')
on conflict (slug) do nothing;

insert into public.sessions (event_id, slug, title, description, start_time, end_time)
select id, 'session-1', 'Deepfakes in Everyday Social Media (TikTok, Facebook, Instagram)', E'8:00AM - 8:10AM | Ingress, Opening Remarks, and Introduction of Speaker\n8:10AM - 10:10AM | UDANI, VARNARD PAULO | How AI is Changing Social Media\n10:10AM - 10:30AM | Screen Break\n10:30AM - 12:30PM | BALLON, GLENBERG JAMES | Protecting Your Digital Self by Spotting Everyday Fakes', '2026-10-18 08:00:00+08', '2026-10-18 13:00:00+08' from public.events where slug = 'deepfakes-digital-trust-2026'
on conflict (event_id, slug) do update set title = excluded.title, description = excluded.description, start_time = excluded.start_time, end_time = excluded.end_time;
insert into public.sessions (event_id, slug, title, description, start_time, end_time)
select id, 'session-2', 'Deepfakes in the Workplace and School (Email, Zoom, News)', E'2:00PM - 2:10PM | Ingress, Opening Remarks, and Introduction of Speaker\n2:10PM - 4:10PM | ROSETE, FRANCIS EMIL | AI in the Workplace and School\n4:10PM - 4:30PM | Screen Break\n4:30PM - 6:30PM | GONZALES, ICON ZEUS | Building Digital Trust and How to Verify the Truth in an AI World', '2026-10-18 14:00:00+08', '2026-10-18 19:00:00+08' from public.events where slug = 'deepfakes-digital-trust-2026'
on conflict (event_id, slug) do update set title = excluded.title, description = excluded.description, start_time = excluded.start_time, end_time = excluded.end_time;
