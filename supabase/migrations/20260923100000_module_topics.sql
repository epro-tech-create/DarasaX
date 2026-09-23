-- Module topics: course outline managed by Admin / Class Rep.
-- Students read published topics; completion stays client-side per student.

create table if not exists public.module_topics (
  id text primary key,
  module_id text not null,
  number integer not null check (number > 0),
  title text not null,
  duration_minutes integer not null default 20 check (duration_minutes > 0),
  summary text,
  published boolean not null default true,
  created_by text not null default '',
  created_by_id uuid references auth.users (id) on delete set null,
  role text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (module_id, number)
);

create index if not exists module_topics_module_idx on public.module_topics (module_id);
create index if not exists module_topics_published_idx on public.module_topics (published);

drop trigger if exists module_topics_set_updated_at on public.module_topics;
create trigger module_topics_set_updated_at
before update on public.module_topics
for each row execute function public.set_updated_at();

alter table public.module_topics enable row level security;

drop policy if exists "Topics readable when published or by staff" on public.module_topics;
create policy "Topics readable when published or by staff"
on public.module_topics for select to authenticated
using (published = true or public.is_staff());

drop policy if exists "Topics writable by staff" on public.module_topics;
create policy "Topics writable by staff"
on public.module_topics for all to authenticated
using (public.is_staff())
with check (public.is_staff());

-- Seed starter outlines for modules that already had curriculum content.
insert into public.module_topics (id, module_id, number, title, duration_minutes, summary, published, created_by, role) values
('topic-net-1','mod-sensor-networks',1,'Introduction to Sensor Networks',18,'What networks are, why they matter, and the basic building blocks — hosts, links, packets, and protocols.',true,'System','admin'),
('topic-net-2','mod-sensor-networks',2,'OSI Model',22,'Walk through the seven OSI layers and how each one solves a different networking problem.',true,'System','admin'),
('topic-net-3','mod-sensor-networks',3,'TCP/IP',25,'Map the practical TCP/IP stack to OSI, and how addressing, ports, and reliable delivery work together.',true,'System','admin'),
('topic-net-4','mod-sensor-networks',4,'Network Devices',20,'Compare hubs, switches, routers, and access points — when to use each.',true,'System','admin'),
('topic-net-5','mod-sensor-networks',5,'Routing',28,'Static vs dynamic routes, routing tables, and how packets find a path.',true,'System','admin'),
('topic-net-6','mod-sensor-networks',6,'Routing Protocols',24,'RIP, OSPF, and BGP at a glance — metrics, convergence, and where each fits.',true,'System','admin'),
('topic-net-7','mod-sensor-networks',7,'Switching',21,'Frame forwarding, MAC learning, VLANs, and Layer 2 efficiency.',true,'System','admin'),
('topic-db-1','mod-db-admin',1,'Introduction to Databases',16,'Data, DBMS concepts, and why structured storage matters for apps.',true,'System','admin'),
('topic-db-2','mod-db-admin',2,'Relational Model',20,'Tables, keys, relationships, and integrity constraints.',true,'System','admin'),
('topic-db-3','mod-db-admin',3,'SQL Basics',24,'SELECT, INSERT, UPDATE, DELETE and simple joins.',true,'System','admin'),
('topic-db-4','mod-db-admin',4,'Database Normalization',22,'1NF–3NF and why good schema design reduces anomalies.',true,'System','admin'),
('topic-se-1','mod-se',1,'Software Process Models',20,'Waterfall, iterative, and agile — when each process fits.',true,'System','admin'),
('topic-se-2','mod-se',2,'Requirements Engineering',22,'Eliciting, documenting, and validating requirements.',true,'System','admin'),
('topic-se-3','mod-se',3,'System Design & Architecture',24,'Layers, patterns, and documenting design decisions.',true,'System','admin'),
('topic-se-4','mod-se',4,'Implementation Practices',18,'Coding standards, version control, and modularity.',true,'System','admin'),
('topic-se-5','mod-se',5,'Testing & Quality Assurance',22,'Unit, integration, and system testing strategies.',true,'System','admin'),
('topic-se-6','mod-se',6,'Agile & Scrum',20,'Roles, sprints, and delivering in increments.',true,'System','admin'),
('topic-se-7','mod-se',7,'Maintenance & Evolution',16,'Bug fixes, refactoring, and long-term support.',true,'System','admin')
on conflict (id) do nothing;
