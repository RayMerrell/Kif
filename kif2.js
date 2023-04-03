/** @type {HTMLCanvasElement} */
/** @type {WebGL2RenderingContext} */
const vertexShaderSource = `#version 300 es
precision mediump float;

layout (location=0) in vec2 aPosition;

void main()
  {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;
const fragmentShaderSource=`#version 300 es
precision mediump float;
uniform vec2 uResolution;
uniform vec2 uMouse;
uniform float fTime;
uniform sampler2D uTexture;

vec2 Norm(float angle){
    return vec2(sin(angle), cos(angle));
}


out vec4 fragColour;

void main(){

    //get pixel co-ord
    vec2 uv = (gl_FragCoord.xy-0.5*uResolution.xy)/uResolution.y;
    vec2 mouse = uMouse.xy / uResolution.xy;

    vec3 col = vec3(0);

    uv*=1.25;
    uv.y -= tan((5.0/6.0)*3.1415*0.1);
    uv.x = abs(uv.x);
    vec2 norm = Norm((5.0/6.0)*3.1415);
    float dist = dot(uv-vec2(0.5,0.00), norm);
    uv -= norm * max(0.0,dist) * 2.0;

    //col +=smoothstep (1.0/uResolution.y, 0.0, abs(dist));

    norm = Norm((2.0/3.0)*3.1415);
    float scale=1.0;
    uv.x += 0.5;  
    for (int i = 0; i<5;i++){
        uv *= 3.0;
        scale *= 3.0;
        uv.x -= 1.5;        
        //mirror around y axis
        uv.x = abs(uv.x);
        //make line 3 units long
        uv.x -= 0.5;
        uv -= norm * min(0.0,dot(uv, norm)) * 2.0;

    }
    
    //dist = uv.x;
    //col += 0.125*smoothstep(1.0/uResolution.y,0.0, dist/scale);
    dist = length(uv - vec2(clamp(uv.x, -1.0, 1.0), 0.0));
    //col += smoothstep(1.0/uResolution.y,0.0, dist/scale);
    uv/=scale; 
    col += texture(uTexture, uv *2.0 - fTime * 0.09).rgb;

    fragColour = vec4(col, 1.0);
}
`;
const canvas= document.getElementById("kif");
const gc = canvas.getContext('webgl2');
 
const program = gc.createProgram();

const vertexShader = gc.createShader(gc.VERTEX_SHADER);
gc.shaderSource(vertexShader, vertexShaderSource);
gc.compileShader(vertexShader);
gc.attachShader(program, vertexShader);

const fragmentShader = gc.createShader(gc.FRAGMENT_SHADER);
gc.shaderSource(fragmentShader, fragmentShaderSource);
gc.compileShader(fragmentShader);
gc.attachShader(program, fragmentShader);

gc.linkProgram(program);
if(!gc.getProgramParameter(program, gc.LINK_STATUS)){
    console.log(gc.getShaderInfoLog(vertexShader));
    console.log(gc.getShaderInfoLog(fragmentShader));    
}

gc.useProgram(program);

const uPositionLoc = gc.getUniformLocation(program, 'uPosition');
const uResolutionLoc = gc.getUniformLocation(program, 'uResolution');
const uMouseLoc = gc.getUniformLocation(program, 'uMouse');
const uTimeLoc = gc.getUniformLocation(program, 'fTime');

gc.enableVertexAttribArray(uPositionLoc);
const positionBuffer = gc.createBuffer();
gc.bindBuffer(gc.ARRAY_BUFFER, positionBuffer);
gc.bufferData(gc.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
     1, -1,
    -1,  1,
    -1,  1,  // second triangle
     1, -1,
     1,  1,
  ]), gc.STATIC_DRAW);

gc.vertexAttribPointer(
    uPositionLoc,
    2,          // 2 components per iteration
    gc.FLOAT,   // the data is 32bit floats
    false,      // don't normalize the data
    0,          // 0 = move forward size * sizeof(type) each iteration to get the next position
    0,          // start at the beginning of the buffer
);

const pixels = new Uint8Array([
    182, 73, 78,
    133, 182, 73,
    73, 182, 177,
    122, 73, 182,
    255,0,0,
    128,128,0,
    227,181,5,
    136,0,68,

]);
182, 73, 78, 133, 182, 73,73, 182, 177,122, 73, 182


//mouse movement
let mouseX=0;
let mouseY=0;
const setMousePos =(e) =>{
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
    gc.uniform2f(uMouseLoc, mouseX, mouseY); 

};

let t= 0.0;

const drawCanvas =()=>{
    t +=0.01;
    const displayWidth=canvas.clientWidth;
    const displayHeight=canvas.clientHeight;
    canvas.width = displayWidth;
    canvas.height = displayHeight; 
    gc.viewport(0, 0, gc.canvas.width, gc.canvas.height);  
    gc.uniform2f(uResolutionLoc, canvas.width, canvas.height);
    gc.uniform1f(uTimeLoc,t);  
    gc.drawArrays(gc.TRIANGLES, 0,6);
    requestAnimationFrame(drawCanvas);
}
const texture = gc.createTexture();

const imageLoaded=()=>{    
    console.log("image in");
    gc.bindTexture(gc.TEXTURE_2D, texture);
    gc.texImage2D(gc.TEXTURE_2D, 0, gc.RGB,2048,1367,0,gc.RGB, gc.UNSIGNED_BYTE, texture.image);
	gc.generateMipmap(gc.TEXTURE_2D);
	if (gc.INVALID_OPERATION == true) alert ("Invalid op");
	if (gc.INVALID_VALUE == true) alert ("Invalid value");
	if (gc.INVALID_ENUM == true) alert ("Invalid Enum");
//	gc.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_WRAP_S, gc.CLAMP_TO_EDGE); 
//	gc.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_WRAP_T, gc.CLAMP_TO_EDGE);
	gc.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_MAG_FILTER, gc.NEAREST);
	gc.texParameteri(gc.TEXTURE_2D, gc.TEXTURE_MIN_FILTER, gc.LINEAR_MIPMAP_LINEAR);

    drawCanvas();
}
//canvas.addEventListener('mousemove', setMousePos);
window.addEventListener('resize', drawCanvas);
texture.image = document.getElementById('backgroundimage');
texture.onLoad = imageLoaded();

//texture.image.addEventListener('onload', imageLoaded);
//drawCanvas();