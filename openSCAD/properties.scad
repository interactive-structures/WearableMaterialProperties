/* [End effector: ]*/
Type = "Arc"; //["Arc", "Flat", "Texture"]
height = 10; //[8.0: 12.0] float
endThickness = 0.4; //[0.2:1] float

/* [Bistable Switch:]*/
Connected = false; //[true, false]

/* [Parameters: ] */
angle = 45; //[40 : 80]
thickness = 0.4;//[0.2 : 1.0] float
beamLength = 3.0; // [2.1 : 6.0] float

/* [Mesh Design: ] */
Xnumber = 3;//[1:100]
Ynumber = 3;//[1:100]
orientation = 0;//[0,90]

module __Customizer_Limit__ () {}
shown_by_customizer = false;

/* Constants */
depth = 7;//[1 : 10]
beamDistance = 0.6;
totalWidth = 4; //half of it
blockWidth = 1; //half of it
blockHeight = (2 * thickness + beamDistance) / cos(angle) + 0.2;
constrainWidth = totalWidth - blockWidth - beamLength * cos(angle);
constrainHeight = lengthOffsetBeam(thickness) * sin(angle) + 0.4;
echo(constrainHeight);
bottomHeight = 1.2;
wedgeWidth = 0.8; 
totalHeight = height; //max(2 + beamDistance + constrainHeight + beamLength * sin(angle) + blockHeight, height);

holeDiameter = 0.4;

resolution = 100;
$fn = resolution;

function lengthOffsetBeam(offset) = beamLength + offset / tan(angle) + offset * tan(angle);

function getWidth() = min(endThickness, (thickness + beamDistance) * sin(angle)); //(constrainWidth - thickness / sin(angle))

/* Bistable Switch */
module half(angle, beamLength, thickness){  
    union(){
        //bottom
        cube([totalWidth, depth, bottomHeight]);
        
        //constraint
        translate([totalWidth - constrainWidth, 0, bottomHeight]) 
        cube([constrainWidth, depth, constrainHeight]);
        translate([totalWidth - thickness * 2 + 0.1, 0, 0]) 
        cube([thickness -0.1, depth, bottomHeight + constrainHeight + (beamDistance + thickness) / cos(angle)]);
        
        union(){
        //block
        translate([0, 0, bottomHeight + constrainHeight + beamLength * sin(angle)]) cube([blockWidth, depth, blockHeight]);
        //r = sqrt(blockWidth*blockWidth+blockHeight*blockHeight/4);
        //translate([0, 0, 1.2 + blockHeight/2+constrainHeight + beamLength * sin(angle)]) rotate([-90,0,0]) cylinder(depth,r, r);
        
        //beam1
        translate([blockWidth - thickness * sin(angle), 0, bottomHeight + constrainHeight + lengthOffsetBeam(thickness) * sin(angle) -thickness * cos(angle)]) rotate([0, angle, 0]) cube([lengthOffsetBeam(thickness), depth, thickness]);
        
       //beam2
       intersection() {
            cube([totalWidth, depth, blockHeight + bottomHeight + constrainHeight + beamLength * sin(angle)]);
            translate([blockWidth - thickness * sin(angle), 0, blockHeight + bottomHeight + constrainHeight + beamLength * sin(angle)- thickness * cos(angle)]) rotate([0, angle, 0]) cube([lengthOffsetBeam(2 * thickness + 0.6), depth, thickness]);
        }; 
    }
        
        //2.67 here is hardcoded
        /*intersection(){
            translate([0,0,2.67+constrainHeight + beamLength * sin(angle) + blockHeight - totalWidth]) rotate([-90,0,0]) cylinder(depth, 2.8, 2.8);
            translate([0,0,blockHeight + 1.2 + constrainHeight + beamLength * sin(angle)]) cube([totalWidth, depth, 4]);
        };*/
        
        //blockHeight + beamLength * sin(angle) - (totalWidth - blockWidth - 0.4) * tan(angle)
        
        translate([totalWidth - getWidth(), 0, bottomHeight + constrainHeight]) cube([getWidth(), depth, (thickness + beamDistance) / cos(angle)]);//blockHeight + beamLength * sin(angle) - (totalWidth - blockWidth - 0.4) * tan(angle)
    };
    
    translate([totalWidth - constrainWidth, 0, bottomHeight]) polyhedron(
    points=[[0,0,0],[0,depth,0],[0,depth,constrainHeight],[0,0,constrainHeight],[-wedgeWidth,0,0], [-wedgeWidth,depth,0]],
    faces=[[0,1,2,3],[5,4,3,2],[0,4,5,1],[0,3,4],[5,2,1]]
    );
};
            
module bistableSwitch(angle, beamLength, thickness){
    difference(){
        union(){
            half(angle, beamLength, thickness);
            mirror([1,0,0]) half(angle, beamLength, thickness);
        };
        //hole
        translate([0, 0, blockHeight / 2 + 1.2 + constrainHeight + beamLength * sin(angle)]) rotate([-90,0,0]) cylinder(depth,holeDiameter,holeDiameter);
    } 
    
    //pad
    difference(){
        translate([-(totalWidth - constrainWidth), 0, 1.2 + 0.6])       difference(){
                cube([(totalWidth - constrainWidth) * 2, depth,       0.6]);
                translate([0,-1,-1]) cube([1.2, depth + 2, 0.8 +       2]);
        };
        //hole
        translate([-(totalWidth - constrainWidth-1.3 - 1), depth/2+1.4, 0]) cylinder(1.2+0.6+thickness+0.5, 0.3, 0.3);
        translate([-(totalWidth - constrainWidth-1.3 - 1), depth/2-1.4, 0]) cylinder(1.2+0.6+thickness+0.5, 0.3, 0.3);
    }
}

/* End Effector */
module arc(angle, beamLength, thickness){
    translate([0,0, totalHeight - totalWidth]) intersection(){
        translate([-totalWidth,0,0]) cube([totalWidth * 2, depth, totalWidth]);
        rotate([-90,0,0]) difference(){
             cylinder(depth, totalWidth, totalWidth);
             cylinder(depth, totalWidth - endThickness, totalWidth - endThickness);
        };
    };
    
    // arc height =  totalHeight - totalWidth
    //bistable wall height: 1.2 + constrainHeight + blockHeight + beamLength * sin(angle) - (totalWidth - blockWidth - 0.4) * tan(angle)]);
    foo = max(totalHeight - totalWidth -constrainHeight - bottomHeight - (thickness + beamDistance) / cos(angle), 0);
    //connect to the spring
    translate([totalWidth - endThickness, 0, bottomHeight + constrainHeight + (thickness + beamDistance) / cos(angle)]) cube([endThickness, depth, foo]); 
    
    mirror([1,0,0]) translate([totalWidth - endThickness, 0, bottomHeight + constrainHeight + (thickness + beamDistance) / cos(angle)]) cube([endThickness, depth, foo]);  
}

module square(angle, beamLength, thickness){ 
    translate([-totalWidth, 0, 0]) difference(){
        cube([totalWidth * 2, depth, totalHeight]);
        translate([endThickness,-1,endThickness]) cube([(totalWidth - endThickness) * 2, depth+2, totalHeight - endThickness*2]);
        };
}

//text
module tCell(){
    translate([0, 0, 0.1]) rotate([90, 0, 0]) linear_extrude(height = 0.2) text(text = str(height," ", endThickness, " ", angle," ", thickness," ",beamLength), size = 0.8, halign = "center");
    }

/* Types of cells */
module stiffnessArcCell(angle, beamLength, thickness){
    bistableSwitch(angle, beamLength, thickness);
    arc(angle, beamLength, thickness);
    //tCell();
}

module stiffnessSquareCell(angle, beamLength, thickness){
    bistableSwitch(angle, beamLength, thickness);
    square(angle, beamLength, thickness);
    //tCell();
}

module heightArcCell(angle, beamLength, thickness){
    connectLength = totalHeight- (1 + constrainHeight + beamLength * sin(angle)+blockHeight);

    bistableSwitch(angle, beamLength, thickness);
    translate([-endThickness/2,0, blockHeight + 1 + constrainHeight + beamLength * sin(angle)]) cube([endThickness, depth, connectLength]);
    arc(angle, beamLength,thickness);
    //tCell();
}


module heightSquareCell(angle, beamLength, thickness){
    connectLength = totalHeight - (1.2 + constrainHeight + beamLength * sin(angle)+blockHeight);
    
    bistableSwitch(angle, beamLength, thickness);
    translate([-endThickness/2,0, blockHeight + bottomHeight + constrainHeight + beamLength * sin(angle)]) cube([endThickness, depth, connectLength]);
    square(angle, beamLength, thickness);
    //tCell();
}

module textureSquareCell(angle, beamLength, thickness){
    bistableSwitch(angle, beamLength, thickness);
 
    intersection(){
        translate([0,0, 0.6 + blockHeight + constrainHeight + beamLength * sin(angle)]) rotate([0,-40,0]) cube([0.4, depth, 3]);
        translate([-totalWidth,0,0])cube([totalWidth, depth, bottomHeight +1 + blockHeight + constrainHeight + beamLength * sin(angle)]);
    };
    
    
    intersection(){
        translate([-0.5,0, 0.6+ blockHeight + constrainHeight    + beamLength * sin(angle)]) rotate([0,40,0]) cube([0.4, depth, 3]);
        cube([totalWidth, depth, 1+1.2+ blockHeight + constrainHeight + beamLength * sin(angle)]);
    };
    
    h = 1 + bottomHeight + constrainHeight + beamLength * sin(angle)+blockHeight;
    difference(){
        translate([-totalWidth, 0, 0]) difference(){
        cube([totalWidth * 2, depth, h]);
        translate([endThickness,-1,endThickness]) cube([(totalWidth - endThickness) * 2, depth+2, h - endThickness*2]);
        };
        translate([-blockWidth,-1, blockHeight + bottomHeight + constrainHeight + beamLength * sin(angle)]) cube([blockWidth*2, depth+2, 3]);
    }
    //tCell();
}

module hairTop(){
    h = 1 + bottomHeight + constrainHeight + beamLength * sin(angle)+blockHeight;
    for (i=[1:totalWidth]){
        translate([(i-1)*1 + 0.8, 0 ,h])
            cube([0.2, depth, 3]);
        mirror([1,0,0]) translate([(i-1)*1 + 0.8, 0 ,h])
            cube([0.2, depth, 3]);
    }
}

module hairSide(){
    h = bottomHeight + constrainHeight + beamLength * sin(angle)-0.3;
    for (j=[1:4]){
       translate([totalWidth, 0, (j-1)*1+h])
            cube([3, depth, 0.2]);
       mirror([1,0,0]) translate([totalWidth, 0, (j-1)*1+h]) cube([3, depth, 0.2]);
    }
}

switchHeight = 1 + constrainHeight + thickness / cos(angle) - 0.4;

/* Grid of cells*/
module tHolder(){
    translate([0, -1.1, 1]) rotate([90, 0, 0]) linear_extrude(height = 0.2) text(text = str(angle," ", thickness), size = 0.8, halign = "center");
    }
    
module cellHolder(){
    translate([0, totalWidth + 0.6 - 1.1, switchHeight / 2 + 0.5]) difference(){
        cube([totalWidth * 2 + 1.2, totalWidth * 2 + 1.2, switchHeight + 1.6],center=true);
        translate([0, 0, 1.6]) cube([totalWidth * 2, 7.2, switchHeight],center=true);
        }
    //tHolder();
}

stiffnessArcCell(angle, beamLength, thickness);
//textureSquareCell(angle, beamLength, thickness);
//hairTop();