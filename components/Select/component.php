<?php
namespace Wpsyde\Components\Select;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['name'=>'','options'=>[],'value'=>'','placeholder'=>'','class'=>'','attrs'=>[]];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); $base='h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'; return trim("$base {$p['class']}");}
function render(array $p=[]): string {$p=with_defaults($p,defaults()); $attrs=''; foreach(($p['attrs']??[]) as $k=>$v){$attrs.=sprintf(' %s="%s"',esc_attr($k),esc_attr($v));}
  $options=''; if($p['placeholder']!==''){ $selected=$p['value']===''?' selected':''; $options.=sprintf('<option value="" disabled%s>%s</option>',$selected, esc_html($p['placeholder'])); }
  foreach($p['options'] as $val=>$label){ $sel=(string)$val===(string)$p['value']?' selected':''; $options.=sprintf('<option value="%s"%s>%s</option>',esc_attr($val),$sel,esc_html($label)); }
  return sprintf('<select name="%s" class="%s"%s>%s</select>', esc_attr($p['name']), esc_attr(classes($p)), $attrs, $options);
}

