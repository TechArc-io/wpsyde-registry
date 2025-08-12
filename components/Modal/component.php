<?php
namespace Wpsyde\Components\Modal;

function with_defaults(array $p,array $d){return array_replace($d,array_filter($p,fn($v)=>$v!==null));}
function defaults(): array {return ['open'=>false,'title'=>'','content'=>'','class'=>'','id'=>null];}
function classes(array $p=[]): string {$p=with_defaults($p,defaults()); return trim('fixed inset-0 z-50 hidden items-center justify-center '.($p['open']?'':'').' '.$p['class']);}
function render(array $p=[]): string {
  $p=with_defaults($p,defaults()); $id=$p['id']?:('modal_'.wp_rand());
  $dialog='<div role="dialog" aria-modal="true" aria-labelledby="'.$id.'_title" class="mx-auto w-full max-w-lg rounded-lg border border-border bg-card text-card-foreground shadow-xl">'
    .'<div class="p-4 border-b border-border font-semibold" id="'.$id.'_title">'.wp_kses_post($p['title']).'</div>'
    .'<div class="p-4 text-sm">'.wp_kses_post($p['content']).'</div>'
    .'</div>';
  return '<div id="'.esc_attr($id).'" class="'.esc_attr(classes($p)).'" data-wpsyde-modal><div class="absolute inset-0 bg-background/70" data-modal-close></div><div class="relative z-10 flex items-center justify-center">'.$dialog.'</div></div>';
}

