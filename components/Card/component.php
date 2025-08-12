<?php
namespace Wpsyde\Components\Card;

function with_defaults(array $props, array $defaults): array {
    return array_replace($defaults, array_filter($props, function($v){ return $v !== null; }));
}

function defaults(): array {
    return [
        'content' => '',
        'variant' => 'default', // default|outline|filled|minimal
        'class' => '',
    ];
}

function classes(array $props = []): string {
    $p = with_defaults($props, defaults());
    $base = 'rounded-lg border bg-card text-card-foreground shadow-sm';
    switch ($p['variant']) {
        case 'outline': $variant = 'border-border bg-background text-foreground'; break;
        case 'filled': $variant = 'bg-muted text-muted-foreground border-border'; break;
        case 'minimal': $variant = 'border-transparent bg-transparent text-foreground shadow-none'; break;
        default: $variant = 'border-border';
    }
    return trim("$base $variant {$p['class']}");
}

function render(array $props = []): string {
    $p = with_defaults($props, defaults());
    $classes = classes($p);
    return sprintf('<div class="%s">%s</div>', esc_attr($classes), $p['content']);
}

