<?php
namespace Wpsyde\Components\Navbar;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['theme_location'=>'menu-1','class'=>''];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('flex items-center gap-6 '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults());
  $menu = wp_nav_menu([
    'theme_location'=>$p['theme_location'],
    'container'=>false,
    'menu_class'=>'flex gap-6',
    'echo'=>false,
    'link_before'=>'<span class="text-sm text-muted-foreground transition-colors hover:text-foreground">',
    'link_after'=>'</span>',
    'depth'=>1,
  ]);
  if(!$menu) return '';
  return '<nav class="'.esc_attr(classes($p)).'" aria-label="Primary">'.$menu.'</nav>';
}

