-- Small key/value config table for site content that shouldn't live in source
-- control (e.g. a third party's home address). Values are inserted directly
-- into the live DB, never via a committed migration or seed file.
create table app_config (
  key   text primary key,
  value text not null
);
