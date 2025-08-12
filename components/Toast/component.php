<?php
namespace Wpsyde\Components\Toast;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['variant'=>'info','content'=>'','class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); $base='pointer-events-auto rounded-md border px-4 py-3 text-sm shadow bg-card text-card-foreground'; $variant=match($p['variant']){'success'=>'border-emerald-300','warning'=>'border-amber-300','destructive'=>'border-red-300',default=>'border-border'}; return trim("$base $variant {$p['class']}");}
function render(array $p=[]): string {return '<div class="'.esc_attr(classes(with_defaults($p,defaults()))).'">'.wp_kses_post(with_defaults($p,defaults())['content']).'</div>';}

