<?php
/**
 * Component Manifest
 *
 * Centralized registry describing available and planned atomic components.
 * Each entry uses a Studly name to match folder naming under
 * `template-parts/components/{Studly}/component.php`.
 */

return [
    // Available
    [
        'name' => 'Button',
        'title' => 'Button',
        'status' => 'available',
        'description' => 'Actions with variants and sizes.',
    ],
    [
        'name' => 'Card',
        'title' => 'Card',
        'status' => 'available',
        'description' => 'Surface container for grouping content.',
    ],
    [
        'name' => 'Badge',
        'title' => 'Badge',
        'status' => 'available',
        'description' => 'Small status pill for labeling.',
    ],
    [
        'name' => 'Input',
        'title' => 'Input',
        'status' => 'available',
        'description' => 'Text input field with focus ring.',
    ],
    [
        'name' => 'SectionHeading',
        'title' => 'Section Heading',
        'status' => 'available',
        'description' => 'Title + optional description block.',
    ],

    // Newly added
    [ 'name' => 'Alert', 'title' => 'Alert', 'status' => 'available', 'description' => 'Inline feedback messages.' ],
    [ 'name' => 'Avatar', 'title' => 'Avatar', 'status' => 'available', 'description' => 'User/image avatar.' ],
    [ 'name' => 'Checkbox', 'title' => 'Checkbox', 'status' => 'available', 'description' => 'Boolean input.' ],
    [ 'name' => 'Radio', 'title' => 'Radio', 'status' => 'available', 'description' => 'Radio group input.' ],
    [ 'name' => 'Select', 'title' => 'Select', 'status' => 'available', 'description' => 'Dropdown select.' ],
    [ 'name' => 'SwitchC', 'title' => 'Switch', 'status' => 'available', 'description' => 'Toggle switch input.' ],
    [ 'name' => 'Textarea', 'title' => 'Textarea', 'status' => 'available', 'description' => 'Multiline input.' ],
    [ 'name' => 'Label', 'title' => 'Label', 'status' => 'available', 'description' => 'Form label helper.' ],
    [ 'name' => 'Tooltip', 'title' => 'Tooltip', 'status' => 'available', 'description' => 'Hover/focus information.' ],
    [ 'name' => 'Accordion', 'title' => 'Accordion', 'status' => 'available', 'description' => 'Collapsible sections.' ],
    [ 'name' => 'Tabs', 'title' => 'Tabs', 'status' => 'available', 'description' => 'Tabbed content navigation.' ],
    [ 'name' => 'Separator', 'title' => 'Separator', 'status' => 'available', 'description' => 'Horizontal rule/divider.' ],
    [ 'name' => 'Table', 'title' => 'Table', 'status' => 'available', 'description' => 'Data table primitives.' ],
    [ 'name' => 'Pagination', 'title' => 'Pagination', 'status' => 'available', 'description' => 'Page navigation controls.' ],
    [ 'name' => 'Breadcrumbs', 'title' => 'Breadcrumbs', 'status' => 'available', 'description' => 'Hierarchy navigation.' ],
    [ 'name' => 'Navbar', 'title' => 'Navbar', 'status' => 'available', 'description' => 'Header navigation bar.' ],
    [ 'name' => 'Modal', 'title' => 'Modal', 'status' => 'available', 'description' => 'Dialog overlay.' ],
    [ 'name' => 'Toast', 'title' => 'Toast', 'status' => 'available', 'description' => 'Transient notifications.' ],
];

