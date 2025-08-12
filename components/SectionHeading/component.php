<?php
namespace Wpsyde\Components\SectionHeading;

function with_defaults(array $props, array $defaults): array {
    return array_replace($defaults, array_filter($props, function($v){ return $v !== null; }));
}

function defaults(): array {
    return [
        'heading' => '',
        'description' => '',
        'alignment' => 'center', // left|center|right
        'class' => '',
    ];
}

function classes(array $props = []): string {
    $p = with_defaults($props, defaults());
    $textAlignment = $p['alignment'] === 'center' ? 'text-center' : ($p['alignment'] === 'right' ? 'text-right' : 'text-left');
    return trim("{$textAlignment} mb-12 {$p['class']}");
}

function render(array $props = []): string {
    $p = with_defaults($props, defaults());
    $classes = classes($p);
    $container = $p['alignment'] === 'center' ? 'mx-auto' : 'max-w-2xl';

    ob_start();
    ?>
    <div class="<?php echo esc_attr($classes); ?>">
        <?php if (!empty($p['heading'])): ?>
            <h2 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                <?php echo wp_kses_post($p['heading']); ?>
            </h2>
        <?php endif; ?>
        <?php if (!empty($p['description'])): ?>
            <p class="text-lg text-muted-foreground <?php echo esc_attr($container); ?>">
                <?php echo wp_kses_post($p['description']); ?>
            </p>
        <?php endif; ?>
    </div>
    <?php
    return ob_get_clean();
}

