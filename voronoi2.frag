// Author: @patriciogv
// Title: Simple Voronoi

#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
    vec2 st = gl_FragCoord.xy/u_resolution.xy;
    st.x *= u_resolution.x/u_resolution.y;
    vec3 color = vec3(0.010,0.007,0.004);

    // Scale
    st *= 5.;

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 0.752;  // minimum distance
    vec2 m_point;        // minimum point

    for (int j=-1; j<=1; j++ ) {
        for (int i=-1; i<=1; i++ ) {
            vec2 neighbor = vec2(float(i),float(j));
            vec2 point = random2(i_st + neighbor);
            point = 0.5 + 0.5*sin(u_time + 6.2831*point);
            vec2 diff = neighbor + point - f_st;
            float dist = length(diff);

            if( dist < m_dist ) {
                m_dist = dist;
                m_point = point;
            }
        }
    }

    // Assign a color using the closest point position
    vec3 aura = vec3(0.730,0.065,0.086)*m_dist*1.476;
    color +=m_dist*-0.976;
    color.r += dot(m_point,vec2(0.290,0.140));
    color.g += dot(m_point,vec2(0.080,0.940));
    color.b += dot(m_point,vec2(0.890,0.090));
	color+=aura;
	
    // Add distance field to closest point center
    //color.g = m_dist;
	
    // Show isolines
    color -= abs(sin(40.0*m_dist))*0.07;
	
    // Draw cell center
    color += 1.-step(.05, m_dist);
	
    // Draw grid
    color.r += step(.98, f_st.x) + step(.98, f_st.y);

    gl_FragColor = vec4(color,1.0);
}