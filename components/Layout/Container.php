<?php
namespace Wpsyde\Components\Layout;

function container_classes(string $width = 'default', bool $padding = true): string {
    $classes = ['mx-auto'];
    if ($padding) { $classes[] = 'px-4 sm:px-6 lg:px-8'; }
    switch ($width) {
        case 'sm': $classes[] = 'max-w-2xl'; break;
        case 'md': $classes[] = 'max-w-4xl'; break;
        case 'lg': $classes[] = 'max-w-6xl'; break;
        case 'xl': $classes[] = 'max-w-7xl'; break;
        case 'full': $classes[] = 'w-full'; break;
        default: $classes[] = 'container';
    }
    return implode(' ', $classes);
}

