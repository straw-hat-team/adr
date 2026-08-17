---
aside: false
pageClass: radar-page
---

# {{ $params.name }} {#quadrant}

{{ $params.description }} Everything the radar places in this quadrant, and where it sits in the current
edition. The rest of the board is on [the radar](/radar/).

<RadarBoard :quadrant="$params.quadrant" />
