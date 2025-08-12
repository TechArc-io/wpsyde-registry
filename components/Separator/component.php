<?php
namespace Wpsyde\Components\Separator;
function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('my-8 border-t border-border '.$p['class']);}
function render(array $p=[]): string {return '<hr class="'.esc_attr(classes($p)).'" />';}

