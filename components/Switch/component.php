<?php
namespace Wpsyde\Components\SwitchC; // avoid PHP keyword conflict

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['name'=>'','checked'=>false,'label'=>'','class'=>'','attrs'=>[]];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring '.$p['class']);}
function render(array $p=[]): string {$p=with_defaults($p,defaults()); $id='sw_'.md5($p['name'].$p['label'].wp_rand()); $checked=$p['checked']?'checked':''; $switch='<button type="button" role="switch" aria-checked="'.($p['checked']?'true':'false').'" class="'.esc_attr(classes($p)).' '.($p['checked']?'bg-primary':'bg-input').'">
  <span class="pointer-events-none inline-block h-5 w-5 translate-x-0 rounded-full bg-background shadow ring-0 transition '.($p['checked']?'translate-x-5':'translate-x-0').'"></span>
</button>';
  // Provide an underlying checkbox for forms
  $checkbox=sprintf('<input type="checkbox" name="%s" value="1" %s hidden>', esc_attr($p['name']), $checked);
  return '<label class="inline-flex items-center gap-2" data-wpsyde-switch>'.$switch.$checkbox.($p['label']?'<span class="text-sm">'.wp_kses_post($p['label']).'</span>':'').'</label>';
}

