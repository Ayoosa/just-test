drop policy if exists "Anyone can read reviews" on public.reviews;
drop policy if exists "Anyone can submit a review" on public.reviews;

create policy "Anyone can read reviews"
on public.reviews
for select
to anon
using (true);

create policy "Anyone can submit a review"
on public.reviews
for insert
to anon
with check (
  char_length(username) between 1 and 32
  and char_length(comment) between 1 and 300
  and star between 1 and 5
);