<?php
namespace Wpsyde\Components\Tabs;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['tabs'=>[], 'active'=>0, 'class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('w-full '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  if(empty($p['tabs'])) return '';
  $nav=''; $panels=''; $i=0; foreach($p['tabs'] as $tab){
    $isActive=$i===$p['active'];
    $nav.='<button type="button" data-tab-button class="px-4 py-2 text-sm border-b-2 '.($isActive?'border-primary text-foreground':'border-transparent text-muted-foreground').'">'.wp_kses_post($tab['label']??('Tab '.($i+1))).'</button>';
    $panels.='<div data-tab-panel class="'.($isActive?'block':'hidden').' p-4 text-sm">'.wp_kses_post($tab['content']??'').'</div>';
    $i++;
  }
  // No JS baseline shows first tab; progressive enhancement via data attributes
  return '<div class="'.esc_attr(classes($p)).'" data-wpsyde-tabs>'
    .'<div class="flex gap-2 border-b border-border">'.$nav.'</div>'
    .'<div>'.$panels.'</div>'
    .'</div>';
}

