model gratt_ciel

/* Insert your model definition here */
global {
    file shape_file_buildings <- file("./../../includes/Groupe_3/Bati_Zone.shp");
    file shape_file_roads <- file("./../../includes/Groupe_3/routes.shp");
    file shape_file_vege <- file("./../../includes/Groupe_3/parc.shp");
    file shape_file_toits <- file("./../../includes/Groupe_3/Toits.shp");
    file image1 <- file("./../../includes/Groupe_3/legend_gama.png");
    file shape_file_bounds <- file("./../../includes/Groupe_3/area.shp");
    geometry shape <- envelope(shape_file_bounds);
    float step <- 0.1 #mn;
    date starting_date <- date("2019-09-01-00-00-00");
    int nb_people <- 200;
    int min_work_start <- 13;
    int max_work_start <- 22;
    int min_work_end <- 19; 
    int max_work_end <- 23; 
    float min_speed <- 0.08 #km / #h;
    float max_speed <- 0.1 #km / #h; 
    graph the_graph;
    int scenario <- 1;
    
    init {
    
    create building from: shape_file_buildings with: [type::string(read ("usage_1"))] {
        if type="Résidentiel" {
        color <- #gray ;
        }
        if type="Industriel" or type="Commercial et services"{
        color <- #gray ;
        }
    }

    create road from: shape_file_roads ;
    the_graph <- as_edge_graph(road);
    
    create vege from: shape_file_vege ;
    
    create toits from: shape_file_toits with: [type::string(read ("type"))] {
        if type="vege" {
        color <- #lime ;
        }
        if type="toit" {
        color <- #lightgreen ;
        }
    }
    
    create image_legende number:1{
    	location <- {world.shape.width*0.15, world.shape.height*0.91};
    }

    list<building> residential_buildings <- building where (each.type="Résidentiel");
    list<building> industrial_buildings <- building  where (each.type="Industriel" or each.type="Commercial et services" ) ;

	/* Public vers parcs */
    create people_public number: nb_people {
        speed <- rnd (min_speed, max_speed);
        start_work <- rnd (min_work_start, max_work_start);
        end_work <- rnd (min_work_end, max_work_end);
        living_place <- one_of (residential_buildings) ;
        if (scenario = 0)
        {
        	working_place <- one_of(vege);
        } 
        if (scenario=1){
        	  if flip(0.2){
        	working_place <- one_of(toits) ;
        }
        else{
        	working_place <- one_of(vege) ;
        }
        }
        objective <- "resting";
        location <- any_location_in (living_place); 
    }

	/* Privé vers toits */
    create people_prive number: nb_people {
        speed <- rnd(min_speed, max_speed);
        start_work <- rnd (min_work_start, max_work_start);
        end_work <- rnd(min_work_end, max_work_end);
        living_place <- one_of(residential_buildings) ;
        if (scenario = 0)
        {
        	working_place <- one_of(toits);
        }
        if (scenario=1){
        	  if flip(0.2){
        	working_place <- one_of(vege) ;
        }
        else{
        	working_place <- one_of(toits) ;
        }
        }
        objective <- "resting";
        location <- any_location_in (living_place); 
    }
}
}

species building {
    string type; 
    rgb color <- #gray  ;
    aspect base {
    draw shape color: color ;
    }
}
species vege parent:building {
    string type; 
    rgb color <- #green  ;
    aspect base {
    draw shape color: color ;
    }
}
species toits parent:building {
    string type; 
    rgb color <- #lightgreen  ;
    aspect base {
    draw shape color: color ;
    }
}
species road  {
    rgb color <- #white ;
    aspect base {
    draw shape color: color ;
    }
}
species image_legende  {
    aspect base {
    draw square (100) color:#white;
    draw image_file (image1) size:{100#px, 100#px}
    rotate:90;
    }
}
species people_public skills:[moving] {
    rgb color <- #orange ;
    building living_place <- nil ;
    building working_place <- nil ;
    int start_work ;
    int end_work  ;
    string objective ; 
    point the_target <- nil ;
    int profile;      
    
    reflex time_to_work when: current_date.hour = start_work and objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    }        
    reflex time_to_go_home when: current_date.hour = end_work and objective = "working"{
    objective <- "resting" ;
    the_target <- any_location_in (living_place); 
    }
    reflex move when: the_target != nil {
    do goto target: the_target on: the_graph ; 
    if the_target = location {
        the_target <- nil ;
    }}
    reflex chill when: the_target = nil and  objective = "working"{
     	do wander ;
    }
    aspect base {
    draw circle(3) color: color border: #orange -25;
    }
}

species people_prive skills:[moving] {
    rgb color <- #purple ;
    building living_place <- nil ;
    building working_place <- nil ;
    int start_work ;
    int end_work  ;
    string objective ; 
    point the_target <- nil ;
        
    reflex time_to_work when: current_date.hour = start_work and objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    }
    reflex time_to_go_home when: current_date.hour = end_work and objective = "working"{
    objective <- "resting" ;
    the_target <- any_location_in (living_place); 
    } 
    reflex move when: the_target != nil {
    do goto target: the_target on: the_graph ; 
    if the_target = location {
        the_target <- nil ; 
    }}
    reflex chill when: the_target = nil and  objective = "working"{
     	do wander ;
    }
    aspect base {
    draw circle(3) color: color border: #purple -25;
    }
}

experiment road_traffic type: gui {
    parameter "Shapefile for the buildings:" var: shape_file_buildings category: "GIS" ;
    parameter "Shapefile for the roads:" var: shape_file_roads category: "GIS" ;
    parameter "Shapefile for the bounds:" var: shape_file_bounds category: "GIS" ;  
    parameter "Number of people agents" var: nb_people category: "People" ;
    parameter "Earliest hour to start work" var: min_work_start category: "People" min: 2 max: 8;
    parameter "Latest hour to start work" var: max_work_start category: "People" min: 8 max: 12;
    parameter "Earliest hour to end work" var: min_work_end category: "People" min: 12 max: 16;
    parameter "Latest hour to end work" var: max_work_end category: "People" min: 16 max: 23;
    parameter "minimal speed" var: min_speed category: "People" min: 0.01 #km/#h ;
    parameter "maximal speed" var: max_speed category: "People" max: 10 #km/#h;
    
    output {
    display city_display type: opengl rotate:90{
        species building aspect: base ;
        species road aspect: base ;
        species people_public aspect: base position:{0,0,0.01};
        species people_prive aspect: base position:{0,0,0.01} ;
        species vege aspect: base ;
        species toits aspect: base ;        
        species image_legende aspect: base position:{0,0,0.02}; 
    }
    }
}