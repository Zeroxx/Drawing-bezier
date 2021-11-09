import React, {useRef, useEffect, useState} from 'react';
import { LazyBrush, Coordinates } from 'lazy-brush';
import './DrawCanvas.css';
import { findCanvasPosition, copyTouch, middleCoordinatePoint, getPositions, resizeCanvasToDisplay, getCanvasWidth, getCanvasHeight } from './utils/drawUtils';

  interface SavedLines {
      points: Coordinates[];
      drawColor: string;
      drawRadius: number;
  }

function DrawCanvas () {
    const [drawing, setDrawing] = useState(false);
    const [isPressing, setIsPressing] = useState(false);
    const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [redrawCtx, setRedrawCtx] = useState<CanvasRenderingContext2D | null>(null);
    const [drawColor, setDrawcolor] = useState<string>('#000');
    const [drawRadius, setDrawRadius] = useState<number>(4);
    const [points, setPoints] = useState<Coordinates[]>([]);
    const [drawnLines, setDrawnLines] = useState<SavedLines[]>([]);
    const [canvasHeight, setCanvasHeight] = useState<number>(600);
    const [canvasWidth, setCanvasWidth] = useState<number>(800);

    const lazyBrush = new LazyBrush({
        radius: 1,
        enabled: true,
        initialPoint: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        }
    });

    const ongoingTouches = new Array;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const redrawCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleTouchStart = (event: React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!canvas || !ctx) return;
        const touches = event.changedTouches;
        const offset = findCanvasPosition(canvas);  
        if (!offset) return; 
        for (let i = 0; i < touches.length; i++) {
            const positions = getPositions(offset.x, offset.y, touches[i].clientX, touches[i].clientY);
            if(positions.x > 0 && positions.x < canvas.width && positions.y > 0 && positions.y < canvas.height){
                event.preventDefault();
                ongoingTouches.push(copyTouch(touches[i]));
                ctx.beginPath();
                ctx.arc(touches[i].clientX - offset.x, touches[i].clientY-offset.y, drawRadius, 0, 2 * Math.PI, false);
                ctx.fillStyle = drawColor;
                ctx.fill();
            }
        }
    }

    const handleMove = (event: React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!canvas || !ctx) return;
        const touches = event.changedTouches;
        const offset = findCanvasPosition(canvas);

        if(!offset) return;
        for (let i = 0; i < touches.length; i++) {
            const positions = getPositions(offset.x, offset.y, touches[i].clientX, touches[i].clientY);
            if(positions.x > 0 && positions.x < canvas.width && positions.y > 0 && positions.y < canvas.height){
                event.preventDefault();
                const index = ongoingTouchIndexById(touches[i].identifier);
                if (index >= 0) {
                    ctx.beginPath();
                    ctx.moveTo(ongoingTouches[index].clientX-offset.x, ongoingTouches[index].clientY-offset.y);
                    ctx.lineTo(touches[i].clientX-offset.x, touches[i].clientY-offset.y);
                    ctx.lineWidth = drawRadius;
                    ctx.strokeStyle = drawColor;
                    ctx.stroke(); 
                    ongoingTouches.splice(index, 1, copyTouch(touches[i]));
                }
            }    
        }
    }

    const handleTouchEnd = (event: React.TouchEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!canvas || !ctx) return;
        const touches = event.changedTouches;
        const offset = findCanvasPosition(canvas);
        if(!offset) return;

        for (let i = 0; i < touches.length; i++) {
            const positions = getPositions(offset.x, offset.y, touches[i].clientX, touches[i].clientY);
            if(positions.x > 0 && positions.x < canvas.width && positions.y > 0 && positions.y < canvas.height){
                event.preventDefault();
                const index = ongoingTouchIndexById(touches[i].identifier);
                if (index >= 0) {
                    ctx.lineWidth = drawRadius;
                    ctx.fillStyle = drawColor;
                    ctx.beginPath();
                    ctx.moveTo(ongoingTouches[index].clientX-offset.x, ongoingTouches[index].clientY-offset.y);
                    ctx.lineTo(touches[i].clientX-offset.x, touches[i].clientY-offset.y);
                    ctx.arc(touches[i].clientX - offset.x, touches[i].clientY-offset.y, drawRadius, 0, 2 * Math.PI, false);
                    ongoingTouches.splice(i, 1);
                }
            }
        }
    }

    function ongoingTouchIndexById(idToFind: number) {
        for (let i = 0; i < ongoingTouches.length; i++) {
          const id = ongoingTouches[i].identifier;
          if (id === idToFind) {
            return i;
          }
        }
        return -1; // not found
      }

    const handlePointerMove = (x:number , y: number, ctx: CanvasRenderingContext2D) => {
        const hasChanged = lazyBrush.update({ x, y });
        const isDisabled = !lazyBrush.isEnabled();
        if (
          (isPressing && hasChanged && !drawing) ||
          (isDisabled && isPressing)
        ) {
          setDrawing(true)
          setPoints(points => [...points, lazyBrush.brush.toObject()]);
        }
    
        if (drawing && (lazyBrush.brushHasMoved() || isDisabled)) {
          setPoints(points => [...points, lazyBrush.brush.toObject()]);
          drawPoints(points, ctx, drawColor, drawRadius);
        }
      };
    
    const drawPoints = (pointsToDraw: Coordinates[], ctx: CanvasRenderingContext2D, currentDrawColor: string, currentDrawRadius: number) => {
        if (pointsToDraw.length < 2) return;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.strokeStyle = currentDrawColor;
        ctx.lineWidth = currentDrawRadius * 2;
    
        let p1 = pointsToDraw[0];
        let p2 = pointsToDraw[1];

        ctx.moveTo(p2.x, p2.y);
        ctx.beginPath();
    
        for (let i = 1, length = pointsToDraw.length; i < length; i++) {
          const midPoint = middleCoordinatePoint(p1, p2);
          ctx.quadraticCurveTo(p1.x, p1.y, midPoint.x, midPoint.y);
          p1 = pointsToDraw[i];
          p2 = pointsToDraw[i + 1];
        }
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
    }

    const saveLine = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        if (points.length < 2) return;

        setDrawnLines([...drawnLines, { points: [...points], drawColor, drawRadius } ]);
        setPoints([]);
    
        const dpi = 1;
        const width = canvas.width / dpi;
        const height = canvas.height / dpi;

        ctx.drawImage(canvas, 0, 0, width, height);
      };

    const findPosition = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, canvas: HTMLCanvasElement) => {
        const x = event.pageX - canvas.offsetLeft;
        const y = event.pageY - canvas.offsetTop;
        return {x, y}
    }
    
    const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        setIsPressing(true);
    }

    const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        event.preventDefault();
        if (!canvas || !ctx) return;
        setDrawing(false)
        setIsPressing(false);
        saveLine(canvas, ctx);
      };

    const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>, canvas: HTMLCanvasElement | null, ctx: CanvasRenderingContext2D | null) => {
        if (!isPressing || !canvas || !ctx) return;
        const offset = findPosition(event, canvas);
        handlePointerMove(offset.x, offset.y, ctx);
    }

    const clearCanvas = (canvas: HTMLCanvasElement | null) => {
        if (!ctx || !canvas) return;
        setDrawnLines([]);
        ctx.clearRect(
          0,
          0,
          canvas.width,
          canvas.height
      );
    }

    interface SafeData {
        lines: SavedLines[];
        width: number;
        height: number;
    }

    const getSaveData = (drawnLines: SavedLines[]): SafeData => {
        const saveData = {
          lines: [...drawnLines],
          width: canvasWidth,
          height: canvasHeight
        };
        return saveData;
      };

    const loadSaveData = (saveData: SafeData, canvas: HTMLCanvasElement | null) => {
      console.log('test', saveData);
        if (typeof saveData !== "object") {
          throw new Error("saveData needs to be of type object!");
        }
        if(!canvas) return;    
        const { lines, width, height } = saveData;
        if (!lines || typeof lines.push !== "function") {
          throw new Error("saveData.lines needs to be an array!");
        }
        clearCanvas(canvas);
        if (width === canvasWidth && height === canvasHeight) {
        simulateDrawingLines(saveData.lines, canvas);
        } 
    }
    
    const simulateDrawingLines = (drawnLines: SavedLines[], canvas: HTMLCanvasElement | null) => {
      if (!canvas || !redrawCtx) return;
      let curTime = 0;
      let timeoutGap = 5;
      drawnLines.forEach(line => {
        const { points, drawColor, drawRadius } = line;
        for (let i = 1; i < points.length; i++) {
          curTime += timeoutGap;
          window.setTimeout(() => {
            drawPoints(points.slice(0, i + 1), redrawCtx, drawColor, drawRadius);
          }, curTime);
        }
        curTime += timeoutGap;
        window.setTimeout(() => {
          saveLine(canvas, redrawCtx);
        }, curTime);
      });
    };

    const handleResize = (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return;
      setCanvasHeight(getCanvasHeight(canvas));
      setCanvasWidth(getCanvasWidth(canvas));
    }

    useEffect(() => {
        if (canvasRef && canvasRef.current){ 
            const canvas = canvasRef.current;
            handleResize(canvas);
            canvas.height = canvasHeight
            canvas.width = canvasWidth
            setCtx(canvas.getContext('2d'));
            if (!ctx) return;
        }

        if (redrawCanvasRef && redrawCanvasRef.current){ 
            const canvas = redrawCanvasRef.current;
            handleResize(canvas);
            canvas.height = canvasHeight
            canvas.width = canvasWidth
            setRedrawCtx(canvas.getContext('2d'));
            if (!redrawCtx) return;  
            resizeCanvasToDisplay(canvas);          
        }
        return; 
    }, [canvasHeight, canvasRef, canvasWidth, ctx, redrawCanvasRef, redrawCtx])

    function downloadObjectAsJson(exportObj: SavedLines[], exportName: string){
      var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
      var downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href",     dataStr);
      downloadAnchorNode.setAttribute("download", exportName + ".json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
    }

    function handleSubmit (event: React.ChangeEvent<HTMLInputElement>, canvas: HTMLCanvasElement | null) {
    
      let file = event.target?.files;
      console.log('testtest', file);
      if (!file) return;

      let reader = new FileReader();
    
      reader.readAsText(file[0]);
    
      reader.onload = function() {
        if (!reader.result || !canvas) return;
        let drawnLinesData = JSON.parse(reader.result as string);
        loadSaveData(getSaveData(drawnLinesData), canvas);
      };
    
     }
    
    return (
        <div className="canvas-wrapper"> 
            <canvas 
                ref={canvasRef} id="drawCanvas" 
                onMouseDown={handleMouseDown} 
                onMouseUp={(event) => handleMouseUp(event, canvasRef.current, ctx)} 
                onMouseMove={(event) => handleMouseMove(event, canvasRef.current, ctx)}
                onTouchMove={(event) => handleMove(event, canvasRef.current, ctx)}
                onTouchStart={(event) => handleTouchStart(event, canvasRef.current, ctx)}
                onTouchEnd={(event => handleTouchEnd(event, canvasRef.current, ctx))}>
            </canvas>    
            <br/>
            <button onClick={() => clearCanvas(canvasRef.current)}>Clear the canvas</button>
            <button onClick={() => downloadObjectAsJson(drawnLines, 'yourArtwork')}>Download my art</button>
            <br/>
            <input type="color" id='drawcolor' onChange={(e) => setDrawcolor(e.target.value)} /> <label>Pick drawcolor</label>
            <br/>
            <input type="number" value={drawRadius} onChange={(e) => setDrawRadius(parseInt(e.target.value))}/><label>Draw radius</label>
            <br/>
            <canvas 
                ref={redrawCanvasRef} id="reDrawCanvas">
            </canvas>    
            <button onClick={() => clearCanvas(redrawCanvasRef.current)}>Clear the canvas</button>
            <button onClick={() => loadSaveData(getSaveData(drawnLines), redrawCanvasRef.current)}>REDRAW ME</button>
            <input type="file" id="myFile" name="filename" onChange={(e) => handleSubmit(e, redrawCanvasRef.current)}></input>
        </div>
    )
}

export default DrawCanvas;