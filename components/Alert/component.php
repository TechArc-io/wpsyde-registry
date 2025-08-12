<?php
namespace Wpsyde\Components\Alert;

function with_defaults(array $props, array $defaults): array { return array_replace($defaults, array_filter($props, fn($v)=>$v!==null)); }

function defaults(): array {
    return [
        'variant' => 'info', // info|success|warning|destructive
        'title' => '',
        'content' => '',
        'class' => '',
    ];
}

function classes(array $props=[]): string {
    $p = with_defaults($props, defaults());
    $base = 'rounded-md border p-4 text-sm';
    $variant = match($p['variant']){
        'success' => 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-100 dark:border-emerald-800',
        'warning' => 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-100 dark:border-amber-800',
        'destructive' => 'bg-red-50 text-red-900 border-red-200 dark:bg-red-900/20 dark:text-red-100 dark:border-red-800',
        default => 'bg-muted text-foreground border-border',
    };
    return trim("$base $variant {$p['class']}");
}

function render(array $props=[]): string {
    $p = with_defaults($props, defaults());
    $title = $p['title'] ? '<div class="font-medium mb-1">'.wp_kses_post($p['title']).'</div>' : '';
    $content = $p['content'] ? '<div class="leading-relaxed">'.wp_kses_post($p['content']).'</div>' : '';
    return sprintf('<div class="%s" role="status">%s%s</div>', esc_attr(classes($p)), $title, $content);
}

