<?php
namespace Wpsyde\Components\Input;

function with_defaults(array $props, array $defaults): array {
    return array_replace($defaults, array_filter($props, function($v){ return $v !== null; }));
}

function defaults(): array {
    return [
        'type' => 'text',
        'name' => '',
        'placeholder' => '',
        'value' => '',
        'class' => '',
        'attrs' => [],
    ];
}

function classes(array $props = []): string {
    $p = with_defaults($props, defaults());
    $base = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
    return trim("$base {$p['class']}");
}

function render(array $props = []): string {
    $p = with_defaults($props, defaults());
    $classes = classes($p);

    $attrs = '';
    foreach ($p['attrs'] as $k => $v) {
        $attrs .= sprintf(' %s="%s"', esc_attr($k), esc_attr($v));
    }

    return sprintf(
        '<input type="%s" name="%s" class="%s" placeholder="%s" value="%s"%s>',
        esc_attr($p['type']),
        esc_attr($p['name']),
        esc_attr($classes),
        esc_attr($p['placeholder']),
        esc_attr($p['value']),
        $attrs
    );
}

