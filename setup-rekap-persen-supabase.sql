-- Persentase Rekap Laporan (Form C2A dan C2B): publik hanya membaca, admin yang mengubah.
-- Jalankan sekali di Supabase SQL Editor.
create table if not exists public.rekap_persen (
  kunci text primary key check (kunci in ('c2a','c2b')),
  nilai jsonb not null,
  diubah timestamptz not null default now()
);

alter table public.rekap_persen enable row level security;

drop policy if exists "rekap_persen_baca" on public.rekap_persen;
drop policy if exists "rekap_persen_admin_tulis" on public.rekap_persen;

create policy "rekap_persen_baca" on public.rekap_persen
  for select using (true);

create policy "rekap_persen_admin_tulis" on public.rekap_persen
  for all to authenticated
  using (auth.uid() = '09a92d1b-8f35-4459-95e7-cf54a202296b')
  with check (auth.uid() = '09a92d1b-8f35-4459-95e7-cf54a202296b');

grant select on public.rekap_persen to anon, authenticated;
grant insert, update, delete on public.rekap_persen to authenticated;
