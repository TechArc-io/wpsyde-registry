<?php
namespace Wpsyde\Components\Button;

// Small utility to merge defaults
function with_defaults(array $props, array $defaults): array {
    return array_replace($defaults, array_filter($props, function($v){ return $v !== null; }));
}

function defaults(): array {
    return [
        'url' => '#',
        'label' => '',
        'target' => '_self',
        'variant' => 'primary', // primary|secondary|destructive|outline|ghost|link
        'size' => 'default',    // sm|default|lg|icon
        'class' => '',
        'attrs' => [],          // extra attributes
    ];
}

function classes(array $props = []): string {
    $p = with_defaults($props, defaults());

    $base = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

    switch ($p['variant']) {
        case 'secondary': $variant = 'bg-secondary text-secondary-foreground hover:bg-secondary/80'; break;
        case 'destructive': $variant = 'bg-destructive text-destructive-foreground hover:bg-destructive/90'; break;
        case 'outline': $variant = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'; break;
        case 'ghost': $variant = 'hover:bg-accent hover:text-accent-foreground'; break;
        case 'link': $variant = 'text-primary underline-offset-4 hover:underline'; break;
        default: $variant = 'bg-primary text-primary-foreground hover:bg-primary/90';
    }

    switch ($p['size']) {
        case 'sm': $size = 'h-9 rounded-md px-3'; break;
        case 'lg': $size = 'h-11 rounded-md px-8'; break;
        case 'icon': $size = 'h-10 w-10'; break;
        default: $size = 'h-10 px-4 py-2';
    }

    return trim("$base $variant $size {$p['class']}");
}

function render(array $props = []): string {
    $p = with_defaults($props, defaults());
    $classes = classes($p);

    // Build attributes
    $attrs = '';
    foreach ($p['attrs'] as $k => $v) {
        $attrs .= sprintf(' %s="%s"', esc_attr($k), esc_attr($v));
    }

    return sprintf(
        '<a href="%s" target="%s" class="%s"%s>%s</a>',
        esc_url($p['url']),
        esc_attr($p['target']),
        esc_attr($classes),
        $attrs,
        esc_html($p['label'])
    );
}

