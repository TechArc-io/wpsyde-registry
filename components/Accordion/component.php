<?php
namespace Wpsyde\Components\Accordion;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['items'=>[], 'class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('space-y-3 '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  $html='';
  foreach($p['items'] as $item){
    $title=$item['title']??''; $content=$item['content']??''; $open=!empty($item['open']);
    $html.='<details '.($open?'open':'').' class="rounded-lg border border-border bg-card" data-wpsyde-accordion-item>'
      .'<summary class="cursor-pointer select-none p-4 font-medium">'.wp_kses_post($title).'</summary>'
      .'<div class="p-4 pt-0 text-sm text-muted-foreground">'.wp_kses_post($content).'</div>'
      .'</details>';
  }
  return '<div class="'.esc_attr(classes($p)).'" data-wpsyde-accordion data-single="false">'.$html.'</div>';
}

