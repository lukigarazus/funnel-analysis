import React from "react";
import ForceGraph2D from "react-force-graph-2d";

const ForceGraph2DA: any = ForceGraph2D;

const { useRef } = React;

const ForceTree = ({
  data,
}: {
  data: {
    nodes: { id: string; group: number }[];
    links: { source: string; target: string; value: number }[];
  };
}) => {
  const fgRef = useRef();
  //   console.log(fgRef);
  return (
    <ForceGraph2DA
      ref={fgRef}
      //   dagMode={"td"}
      //   dagLevelDistance={300}
      nodeLabel="id"
      linkDirectionalParticleColor={() => "red"}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={2}
      linkHoverPrecision={10}
      graphData={data}
      //   minZoom={1}
      //   maxZoom={1}
      zoom={1}
      centerAt={[0, 0]}
      width={500}
      height={500}
      backgroundColor={"#f0f0f0"}
      nodeCanvasObject={(node: any, ctx: any, globalScale: any) => {
        const label = node.id + "";
        const fontSize = 6;
        ctx.font = `${fontSize}px Sans-Serif`;
        const textWidth = ctx.measureText(label).width;
        const bckgDimensions = [textWidth, fontSize].map(
          (n) => n + fontSize * 0.2
        ); // some padding

        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(
          node.x - bckgDimensions[0] / 2,
          node.y - bckgDimensions[1] / 2,
          ...bckgDimensions
        );

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(label, node.x, node.y);

        node.__bckgDimensions = bckgDimensions; // to re-use in nodePointerAreaPaint
      }}
      // onLinkClick={link => fgRef.current.emitParticle(link)}
    />
  );
};

export default ForceTree;
