return `
#ifdef GL_ES
precision mediump float;
#endif

uniform float scale;
uniform vec2 u_mouse;
uniform float u_time;
uniform float dotSize;

varying vec2 vUv;
varying vec3 vnormal;
varying vec3 vposition;

vec2 random2( vec2 p ) {
    return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}

void main() {
    vec2 st = vUv;
    
    vec3 pos = vposition;
    vec3 normal = vnormal;
    
    vec3 color = vec3(.0);
    //scale
    //st *=10.0;
    st *= scale ;
    

    // Tile the space
    vec2 i_st = floor(st);
    vec2 f_st = fract(st);

    float m_dist = 10.;  // minimum distance
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
    vec2 point2 =u_mouse;
    float dist = distance(st, point2);
if ( dist < m_dist ) {
    // Keep the closer distance
    m_dist = dist;

    // Kepp the position of the closer point
    m_point = point2;
}
	color += m_dist*2.;
    color.rg = m_point;
    // Assign a color using the closest point position
    color += dot(m_point,vec2(.3,.6));

    // Add distance field to closest point center
    // color.g = m_dist;

    // Show isolines
    color -= abs(sin(40.0*m_dist))*0.07;

    // Draw cell center
    color += 1.-step(.05, m_dist);

    // Draw grid
    //color.r += step(.98, f_st.x) + step(.98, f_st.y);
    //color.y = position.y;
    gl_FragColor = vec4(color,1.0);
}
`;