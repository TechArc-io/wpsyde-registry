<?php
namespace Wpsyde\Components\Badge;

function with_defaults(array $props, array $defaults): array {
    return array_replace($defaults, array_filter($props, function($v){ return $v !== null; }));
}

function defaults(): array {
    return [
        'text' => '',
        'variant' => 'default', // default|secondary|destructive|outline|ghost|success|warning|info
        'size' => 'default',     // sm|default|lg
        'class' => '',
    ];
}

function classes(array $props = []): string {
    $p = with_defaults($props, defaults());
    $base = 'inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2';
    switch ($p['size']) {
        case 'sm': $size = 'rounded px-1.5 py-0.5 text-xs'; break;
        case 'lg': $size = 'rounded-lg px-3 py-1 text-sm'; break;
        default: $size = 'rounded-full px-2.5 py-0.5 text-xs';
    }
    switch ($p['variant']) {
        case 'secondary': $variant = 'bg-secondary text-secondary-foreground hover:bg-secondary/80'; break;
        case 'destructive': $variant = 'bg-destructive text-destructive-foreground hover:bg-destructive/90'; break;
        case 'outline': $variant = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'; break;
        case 'ghost': $variant = 'hover:bg-accent hover:text-accent-foreground'; break;
        case 'success': $variant = 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700'; break;
        case 'warning': $variant = 'bg-amber-500 text-white hover:bg-amber-600 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-700'; break;
        case 'info': $variant = 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700'; break;
        default: $variant = 'bg-primary text-primary-foreground hover:bg-primary/90';
    }
    return trim("$base $size $variant {$p['class']}");
}

function render(array $props = []): string {
    $p = with_defaults($props, defaults());
    $classes = classes($p);
    return sprintf('<span class="%s">%s</span>', esc_attr($classes), wp_kses_post($p['text']));
}

