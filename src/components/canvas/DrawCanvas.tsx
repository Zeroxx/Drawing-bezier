import React, {useRef, useEffect, useState} from 'react';
import './DrawCanvas.css';

function DrawCanvas () {
    const [drawing, setDrawing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [drawcolor, setDrawcolor] = useState<string>('#000');
    const canvasWidth = 800;
    const canvasHeight = 600;
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const fillCircle = (ctx: CanvasRenderingContext2D, x:number , y: number, drawRadius: number = 4) => {
        ctx.fillStyle = drawcolor;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, drawRadius, 0, Math.PI * 2, false);
        ctx.fill();
    }

    const empty = (ctx: CanvasRenderingContext2D | null) => {
        if (!ctx) return;
        console.log('clear canvas?');
        ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    }

    const mouseDraw = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const x = event.pageX - canvas.offsetLeft;
        const y = event.pageY - canvas.offsetTop;

        fillCircle(ctx, x, y)
    }
    
    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setDrawing(true);
    }

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setDrawing(false);
    }

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!drawing || !canvas || !ctx) return;
        mouseDraw(event, ctx, canvas);
    }

    const resizeCanvasToDisplay = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const { width, height } = canvas.getBoundingClientRect()

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      return true
    }

    return false
  }

    useEffect(() => {
        if (canvasRef && canvasRef.current){ 
            const canvas = canvasRef.current;
            setCtx(canvas.getContext('2d'));
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            if (!ctx) return;  
            resizeCanvasToDisplay(canvas);          
        }
        return; 
    }, [canvasRef, ctx])

    
    return (
        <div className="canvas-wrapper"> 
            <canvas 
                ref={canvasRef} id="drawCanvas" 
                onMouseDown={handleMouseDown} 
                onMouseUp={handleMouseUp} 
                onMouseMove={(event) => handleMouseMove(event, canvasRef.current, ctx)}>
            </canvas>    
            <button onClick={() => empty(ctx)}>Clear the canvas</button>
            <input type="color" id='drawcolor' onChange={(e) => setDrawcolor(e.target.value)} /> <label>Pick drawcolor</label>
        </div>
    )
}

export default DrawCanvas;