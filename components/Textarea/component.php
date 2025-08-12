<?php
namespace Wpsyde\Components\Textarea;

function with_defaults(array $props, array $defaults): array { return array_replace($defaults, array_filter($props, fn($v)=>$v!==null)); }
function defaults(): array { return ['name'=>'','placeholder'=>'','value'=>'','rows'=>4,'class'=>'','attrs'=>[]]; }
function classes(array $props=[]): string { $p=with_defaults($props,defaults()); $base='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'; return trim("$base {$p['class']}"); }
function render(array $props=[]): string {
  $p=with_defaults($props,defaults()); $attrs=''; foreach(($p['attrs']??[]) as $k=>$v){ $attrs.=sprintf(' %s="%s"',esc_attr($k),esc_attr($v)); }
  return sprintf('<textarea name="%s" rows="%d" class="%s" placeholder="%s"%s>%s</textarea>', esc_attr($p['name']), intval($p['rows']), esc_attr(classes($p)), esc_attr($p['placeholder']), $attrs, esc_textarea($p['value']));
}

