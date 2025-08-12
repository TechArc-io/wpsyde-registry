<?php
namespace Wpsyde\Components\Avatar;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['src'=>'','alt'=>'','size'=>'md','class'=>''];}
function classes(array $p=[]): string {
  $p=with_defaults($p,defaults());
  $size = match($p['size']){ 'sm'=>'h-8 w-8','lg'=>'h-16 w-16', default=>'h-12 w-12' };
  return trim('inline-flex items-center justify-center rounded-full bg-muted overflow-hidden '.$size.' '.$p['class']);
}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  if($p['src']){
    return '<span class="'.esc_attr(classes($p)).'"><img src="'.esc_url($p['src']).'" alt="'.esc_attr($p['alt']).'" class="h-full w-full object-cover"/></span>';
  }
  $initials = $p['alt'] ? strtoupper(mb_substr($p['alt'],0,1)) : 'A';
  return '<span class="'.esc_attr(classes($p)).' text-sm text-muted-foreground">'.esc_html($initials).'</span>';
}

