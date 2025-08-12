<?php
namespace Wpsyde\Components\Tooltip;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['text'=>'','content'=>'','class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('underline decoration-dotted underline-offset-4 '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  // Use native title attribute for no-JS baseline. Progressive enhancement can hook data-tooltip.
  return sprintf('<span class="%s" title="%s" data-tooltip="%s">%s</span>', esc_attr(classes($p)), esc_attr(wp_strip_all_tags($p['content'])), esc_attr(wp_strip_all_tags($p['content'])), wp_kses_post($p['text']));
}

