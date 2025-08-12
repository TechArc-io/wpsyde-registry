<?php
namespace Wpsyde\Components\Radio;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['name'=>'','value'=>'','checked'=>false,'label'=>'','class'=>'','attrs'=>[]];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); $base='h-4 w-4 border-input text-primary focus:ring-ring'; return trim("$base {$p['class']}");}
function render(array $p=[]): string {$p=with_defaults($p,defaults()); $attrs=''; foreach(($p['attrs']??[]) as $k=>$v){$attrs.=sprintf(' %s="%s"',esc_attr($k),esc_attr($v));}
  $input=sprintf('<input type="radio" name="%s" value="%s" class="%s" %s%s>', esc_attr($p['name']), esc_attr($p['value']), esc_attr(classes($p)), $p['checked']?'checked ':'', $attrs);
  if($p['label']){return '<label class="inline-flex items-center gap-2">'.$input.'<span class="text-sm">'.wp_kses_post($p['label']).'</span></label>';} return $input;}

