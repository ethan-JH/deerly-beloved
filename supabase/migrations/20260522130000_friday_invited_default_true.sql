alter table invites alter column friday_invited set default true;

update invites set friday_invited = true where friday_invited = false;
