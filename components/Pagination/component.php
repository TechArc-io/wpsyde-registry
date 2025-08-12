<?php
namespace Wpsyde\Components\Pagination;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['query'=>null,'class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('flex items-center gap-2 '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  $links = paginate_links(['type'=>'array','total'=>$p['query']? $p['query']->max_num_pages : 0]);
  if(!$links){ return ''; }
  $items = array_map(fn($l)=>'<li class="inline-block">'.$l.'</li>', $links);
  return '<nav class="'.esc_attr(classes($p)).'" aria-label="Pagination"><ul class="flex flex-wrap gap-2">'.implode('',$items).'</ul></nav>';
}

