<?php
namespace Wpsyde\Components\Table;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['headers'=>[],'rows'=>[],'class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('w-full text-sm text-foreground '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  $thead=''; if(!empty($p['headers'])){ $thead='<thead><tr>'.implode('',array_map(fn($h)=>'<th class="px-4 py-2 text-left font-medium text-muted-foreground">'.wp_kses_post($h).'</th>',$p['headers'])).'</tr></thead>'; }
  $tbody='<tbody>'.implode('',array_map(function($row){ return '<tr>'.implode('',array_map(fn($c)=>'<td class="px-4 py-2 border-t border-border">'.wp_kses_post($c).'</td>',$row)).'</tr>'; },$p['rows'])).'</tbody>';
  return '<div class="overflow-x-auto"><table class="'.esc_attr(classes($p)).'">'.$thead.$tbody.'</table></div>';
}

