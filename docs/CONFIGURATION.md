# 3D Insight Mode - Configuration Guide

## Table of Contents

1. [Global Settings](#global-settings)
2. [Course-Level Configuration](#course-level-configuration)
3. [Creating 3D Problems](#creating-3d-problems)
4. [Geometry Types](#geometry-types)
5. [Advanced Configuration](#advanced-configuration)

## Global Settings

### Accessing Global Settings

1. Log in to Moodle as administrator
2. Navigate to: **Site administration** → **Plugins** → **Blocks** → **3D Insight Mode**

### Available Settings

#### Enable Rotation
- **Setting**: `enable_rotation`
- **Default**: Enabled
- **Description**: Allow users to rotate 3D models using mouse or touch
- **Options**: Yes / No

#### Default View Angle
- **Setting**: `default_camera_angle`
- **Default**: Isometric
- **Description**: Set the default camera angle when a 3D model loads
- **Options**:
  - `isometric` - 45° angle view (default)
  - `front` - Front view
  - `top` - Top-down view
  - `side` - Side view

#### Smartphone Display Mode
- **Setting**: `enable_smartphone_view`
- **Default**: Enabled
- **Description**: Display the 3D viewer in a virtual smartphone interface
- **Options**: Yes / No

#### Smartphone Position
- **Setting**: `smartphone_position`
- **Default**: bottom-right
- **Description**: Default position of the smartphone container
- **Options**:
  - `bottom-right`
  - `bottom-left`
  - `top-right`
  - `top-left`

## Course-Level Configuration

### Setting Up per Course

Course-level settings override global settings and are stored in the `mdl_block_3dinsight_config` table.

#### Via Database (Advanced)

```sql
INSERT INTO mdl_block_3dinsight_config
(courseid, enable_rotation, enable_smartphone_view, default_camera_angle, smartphone_position, timecreated, timemodified)
VALUES
(1, 1, 1, 'isometric', 'bottom-right', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
```

#### Via PHP API

```php
require_once($CFG->dirroot . '/blocks/3dinsight/lib.php');

$configdata = new stdClass();
$configdata->enable_rotation = true;
$configdata->enable_smartphone_view = true;
$configdata->default_camera_angle = 'isometric';
$configdata->smartphone_position = 'bottom-right';

block_3dinsight_save_config($courseid, $configdata);
```

## Creating 3D Problems

### Database Method

Problems are stored in the `mdl_block_3dinsight_problems` table.

#### Example: Create a Cube Problem

```sql
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
  1,
  'Cube Volume Calculation',
  'Calculate the volume of this cube by examining its dimensions',
  'cube',
  '{"width": 2, "height": 2, "depth": 2, "color": 4491519}',
  1,
  1,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP(),
  2
);
```

#### Example: Create a Sphere Problem

```sql
INSERT INTO mdl_block_3dinsight_problems
(courseid, title, description, geometry_type, geometry_data, difficulty, active, timecreated, timemodified, createdby)
VALUES
(
  1,
  'Sphere Surface Area',
  'Determine the surface area of this sphere',
  'sphere',
  '{"radius": 1.5, "widthSegments": 32, "heightSegments": 32, "color": 5025535}',
  2,
  1,
  UNIX_TIMESTAMP(),
  UNIX_TIMESTAMP(),
  2
);
```

### PHP Method

```php
global $DB, $USER;

$problem = new stdClass();
$problem->courseid = $COURSE->id;
$problem->title = 'Pyramid Volume';
$problem->description = 'Calculate the volume of this pyramid';
$problem->geometry_type = 'pyramid';
$problem->geometry_data = json_encode([
    'radius' => 1.5,
    'height' => 3,
    'color' => 0xFF9800
]);
$problem->difficulty = 3;
$problem->active = 1;
$problem->timecreated = time();
$problem->timemodified = time();
$problem->createdby = $USER->id;

$problemid = $DB->insert_record('block_3dinsight_problems', $problem);
```

## Geometry Types

### Basic Shapes

#### 1. Cube / Box

```json
{
  "width": 2,
  "height": 2,
  "depth": 2,
  "color": 4491519
}
```

**Parameters**:
- `width` (number): Width of the box
- `height` (number): Height of the box
- `depth` (number): Depth of the box
- `color` (number): Hex color (decimal format)

#### 2. Sphere

```json
{
  "radius": 1.5,
  "widthSegments": 32,
  "heightSegments": 32,
  "color": 5025535
}
```

**Parameters**:
- `radius` (number): Radius of the sphere
- `widthSegments` (number, optional): Horizontal segments (default: 32)
- `heightSegments` (number, optional): Vertical segments (default: 32)
- `color` (number): Hex color (decimal format)

#### 3. Cylinder

```json
{
  "radiusTop": 1,
  "radiusBottom": 1,
  "height": 3,
  "radialSegments": 32,
  "color": 65280
}
```

**Parameters**:
- `radiusTop` (number): Top radius
- `radiusBottom` (number): Bottom radius
- `height` (number): Height of the cylinder
- `radialSegments` (number, optional): Number of segments (default: 32)
- `color` (number): Hex color (decimal format)

#### 4. Cone

```json
{
  "radius": 1.5,
  "height": 3,
  "radialSegments": 32,
  "color": 16744192
}
```

#### 5. Pyramid (4-sided)

```json
{
  "radius": 1.5,
  "height": 3,
  "color": 16744192
}
```

### Advanced Shapes

#### 6. Torus

```json
{
  "radius": 1.5,
  "tube": 0.4,
  "radialSegments": 16,
  "tubularSegments": 100,
  "color": 16711935
}
```

#### 7. Platonic Solids

**Dodecahedron** (12 faces):
```json
{
  "radius": 1.5,
  "detail": 0,
  "color": 10027008
}
```

**Icosahedron** (20 faces):
```json
{
  "radius": 1.5,
  "detail": 0,
  "color": 5025535
}
```

**Octahedron** (8 faces):
```json
{
  "radius": 1.5,
  "detail": 0,
  "color": 16753920
}
```

**Tetrahedron** (4 faces):
```json
{
  "radius": 1.5,
  "detail": 0,
  "color": 16776960
}
```

#### 8. Prism (n-sided)

```json
{
  "sides": 6,
  "radius": 1.5,
  "height": 3,
  "color": 4491519
}
```

**Parameters**:
- `sides` (number): Number of sides (3-20)
- `radius` (number): Radius of the base
- `height` (number): Height of the prism

### Custom Geometries

For advanced use cases, you can define custom geometries using vertices and faces:

```json
{
  "vertices": [
    [1, 1, 1],
    [-1, 1, -1],
    [-1, -1, 1],
    [1, -1, -1]
  ],
  "faces": [
    [0, 1, 2],
    [0, 3, 1],
    [0, 2, 3],
    [1, 3, 2]
  ],
  "color": 4491519
}
```

**Parameters**:
- `vertices` (array): Array of [x, y, z] coordinates
- `faces` (array): Array of vertex indices forming triangular faces
- `color` (number): Hex color (decimal format)

## Color Reference

Colors are specified as decimal representations of hexadecimal values:

| Color         | Hex     | Decimal   |
|---------------|---------|-----------|
| Red           | #FF0000 | 16711680  |
| Green         | #00FF00 | 65280     |
| Blue          | #0000FF | 255       |
| Yellow        | #FFFF00 | 16776960  |
| Cyan          | #00FFFF | 65535     |
| Magenta       | #FF00FF | 16711935  |
| Orange        | #FF9800 | 16744192  |
| Purple        | #9C27B0 | 10233776  |
| Light Blue    | #4488FF | 4491519   |
| Light Green   | #4CAF50 | 5025616   |

### Converting Hex to Decimal

JavaScript:
```javascript
parseInt('0x4488FF', 16) // Returns: 4491519
```

PHP:
```php
hexdec('4488FF') // Returns: 4491519
```

Python:
```python
int('4488FF', 16) # Returns: 4491519
```

## Advanced Configuration

### Customizing the Smartphone Interface

Edit `/webapp/src/styles/main.css` to customize appearance:

```css
/* Change smartphone size */
.smartphone-frame {
    width: 400px;  /* Default: 375px */
    height: 700px; /* Default: 667px */
}

/* Change app header color */
.smartphone-app-header {
    background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}
```

### Custom Geometry Loaders

You can extend `GeometryFactory` to add custom geometry types:

Edit `/webapp/src/utils/GeometryFactory.js`:

```javascript
// Add new case in create() method
case 'star':
    return this.createStar(data);

// Add new method
static createStar(data) {
    const points = data.points || 5;
    const innerRadius = data.innerRadius || 0.5;
    const outerRadius = data.outerRadius || 1.5;
    // ... implementation
    return geometry;
}
```

### API Rate Limiting

For production environments with many students, consider adding rate limiting to `api.php`:

```php
// At the top of api.php
require_once($CFG->dirroot . '/lib/classes/ratelimiter.php');

$limiter = new \core\ratelimiter($USER->id, 'block_3dinsight_api', 100, 60);
if (!$limiter->check()) {
    echo json_encode(['success' => false, 'error' => 'Rate limit exceeded']);
    exit;
}
```

### Logging and Analytics

Enable detailed logging for analytics:

```php
// In lib.php, add to each function
add_to_log($courseid, 'block_3dinsight', 'view_problem', '', $problemid);
```

## Best Practices

1. **Problem Design**:
   - Start with simple geometries for beginners
   - Gradually increase complexity
   - Use appropriate difficulty levels (1-5)

2. **Performance**:
   - Keep polygon counts under 10,000 for mobile devices
   - Use appropriate segment counts for spheres/cylinders

3. **Accessibility**:
   - Provide clear problem descriptions
   - Use high-contrast colors
   - Test with screen readers

4. **Mobile Optimization**:
   - Test on various devices
   - Ensure touch controls work smoothly
   - Consider smaller smartphone dimensions on mobile

## Troubleshooting Configuration

### Problem: Colors Not Displaying Correctly

**Solution**: Ensure color values are in decimal format, not hex strings:
- Wrong: `"color": "#4488FF"`
- Right: `"color": 4491519`

### Problem: Geometry Not Loading

**Solution**: Validate JSON syntax:
```bash
echo '{"radius": 1.5, "color": 4491519}' | python -m json.tool
```

### Problem: Custom Geometry Appears Black

**Solution**: Ensure faces are defined counter-clockwise and normals are calculated.

## Next Steps

- Read [USAGE.md](USAGE.md) for teacher and student guides
- Read [DEVELOPER.md](DEVELOPER.md) for extending functionality
- Check [API.md](API.md) for API documentation
