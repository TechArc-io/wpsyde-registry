<?php
namespace Wpsyde\Components\Label;

function with_defaults(array $props, array $defaults): array { return array_replace($defaults, array_filter($props, fn($v)=>$v!==null)); }
function defaults(): array { return ['for'=>'','text'=>'','class'=>'']; }
function classes(array $props=[]): string { $p=with_defaults($props,defaults()); $base='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'; return trim("$base {$p['class']}"); }
function render(array $props=[]): string { $p=with_defaults($props,defaults()); return sprintf('<label for="%s" class="%s">%s</label>', esc_attr($p['for']), esc_attr(classes($p)), wp_kses_post($p['text'])); }

