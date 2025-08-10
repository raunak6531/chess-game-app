import React from "react";
import { gsap } from "gsap";
import './FlowingMenu.css';

interface MenuItemProps {
  link: string;
  text: string;
  image: string;
  onClick?: () => void;
}

interface FlowingMenuProps {
  items?: MenuItemProps[];
}

const FlowingMenu: React.FC<FlowingMenuProps> = ({ items = [] }) => {
  return (
    <div className="flowing-menu-container">
      <nav className="flowing-menu-nav">
        {items.map((item, idx) => (
          <MenuItem key={idx} {...item} />
        ))}
      </nav>
    </div>
  );
};

const MenuItem: React.FC<MenuItemProps> = ({ link, text, image, onClick }) => {
  const itemRef = React.useRef<HTMLDivElement>(null);
  const marqueeRef = React.useRef<HTMLDivElement>(null);
  const marqueeInnerRef = React.useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);

  // Check for mobile device on mount and when window resizes
  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const animationDefaults = { duration: 0.6, ease: "expo" };

  const findClosestEdge = (
    mouseX: number,
    mouseY: number,
    width: number,
    height: number
  ): "top" | "bottom" => {
    const topEdgeDist = Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY, 2);
    const bottomEdgeDist =
      Math.pow(mouseX - width / 2, 2) + Math.pow(mouseY - height, 2);
    return topEdgeDist < bottomEdgeDist ? "top" : "bottom";
  };

  // Show animation on hover or touch
  const showAnimation = (clientX: number, clientY: number) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.set(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" })
      .set(marqueeInnerRef.current, { y: edge === "top" ? "101%" : "-101%" })
      .to([marqueeRef.current, marqueeInnerRef.current], { y: "0%" });
  };

  // Hide animation on mouse leave or touch end
  const hideAnimation = (clientX: number, clientY: number) => {
    if (!itemRef.current || !marqueeRef.current || !marqueeInnerRef.current)
      return;
    
    const rect = itemRef.current.getBoundingClientRect();
    const edge = findClosestEdge(
      clientX - rect.left,
      clientY - rect.top,
      rect.width,
      rect.height
    );

    const tl = gsap.timeline({ defaults: animationDefaults });
    tl.to(marqueeRef.current, { y: edge === "top" ? "-101%" : "101%" }).to(
      marqueeInnerRef.current,
      { y: edge === "top" ? "101%" : "-101%" },
      "<"
    );
  };

  const handleMouseEnter = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobile) {
      showAnimation(ev.clientX, ev.clientY);
    }
  };

  const handleMouseLeave = (ev: React.MouseEvent<HTMLAnchorElement>) => {
    if (!isMobile) {
      hideAnimation(ev.clientX, ev.clientY);
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (ev: React.TouchEvent<HTMLAnchorElement>) => {
    if (isMobile) {
      const touch = ev.touches[0];
      showAnimation(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (ev: React.TouchEvent<HTMLAnchorElement>) => {
    if (isMobile) {
      const touch = ev.changedTouches[0];
      hideAnimation(touch.clientX, touch.clientY);
      
      // Handle click on touch end
      if (onClick) {
        ev.preventDefault();
        onClick();
      }
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick && !isMobile) {
      e.preventDefault();
      onClick();
    }
  };

  const repeatedMarqueeContent = React.useMemo(() => {
    return Array.from({ length: 4 }).map((_, idx) => (
      <React.Fragment key={idx}>
        <span className="menu-marquee-text">
          {text}
        </span>
        <div
          className="menu-marquee-icon"
          style={{ backgroundImage: `url(${image})` }}
        />
      </React.Fragment>
    ));
  }, [text, image]);

  return (
    <div
      className="menu-item"
      ref={itemRef}
    >
      <a
        className="menu-item-link"
        href={link}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label={text}
      >
        {text}
      </a>
      <div
        className="menu-marquee"
        ref={marqueeRef}
      >
        <div className="menu-marquee-inner" ref={marqueeInnerRef}>
          <div className="menu-marquee-content">
            {repeatedMarqueeContent}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowingMenu;
