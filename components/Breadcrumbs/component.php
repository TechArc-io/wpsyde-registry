<?php
namespace Wpsyde\Components\Breadcrumbs;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['items'=>[],'class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('text-sm text-muted-foreground '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  if(empty($p['items'])) return '';
  $parts=[]; $last=count($p['items'])-1; $i=0;
  foreach($p['items'] as $label=>$url){ $isLast=$i++===$last; $parts[]=$isLast? '<span class="text-foreground">'.wp_kses_post($label).'</span>' : '<a class="hover:text-foreground" href="'.esc_url($url).'">'.wp_kses_post($label).'</a>'; }
  return '<nav class="'.esc_attr(classes($p)).'" aria-label="Breadcrumb">'.implode(' <span class="px-2">/</span> ',$parts).'</nav>';
}

