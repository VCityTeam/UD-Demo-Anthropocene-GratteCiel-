/**
* Name: Scenario2
* Based on the internal empty template. 
* Author: 33662
* Tags: 
*/


model Scenario2

global {
    file shape_file_buildings <- file("./../../includes/Groupe_2/Bati_zones_avec_commerces.shp");
    file shape_file_roads <- file("./../../includes/Groupe_2/routes.shp");
    file shape_file_bounds <- file("./../../includes/Groupe_2/Emprise_500_1000.geojson");
    file shape_file_supplier <- file("./../../includes/Groupe_2/Entrepots_v2.shp");
    file shape_file_centre_logistique <- file("./../../includes/Groupe_2/centre_logistique.shp");
    file image1 <- file("./../../includes/Groupe_2/legende_centrelog.png");
    geometry shape <- envelope(shape_file_bounds);
    float step <- 0.1 #mn;
    date starting_date <- date("2019-09-01-00-00-00");
    int nb_people <- 20;
    int min_work_start <- 6;
    int max_work_start <- 6;
    int min_work_end <- 7; 
    int max_work_end <- 7; 
    int nb_people_2 <- 50;
    int min_work_start_2 <- 8;
    int max_work_start_2 <- 9;
    int min_work_end_2 <- 18; 
    int max_work_end_2 <- 22; 
    float min_speed <- 0.3 #km / #h;
    float max_speed <- 0.3 #km / #h; 
    float min_speed_2 <- 0.1 #km / #h;
    float max_speed_2 <- 0.2 #km / #h; 
    graph the_graph;
     init {
    create building from: shape_file_buildings with: [type::string(read ("usage_1"))] {
        if type="RÃ©sidentiel" {
        color <- #blue ;
        }
        if type="Commerce nouveau" or type="Commercial et services"{
        color <- #red ;
        }
    }
    create road from: shape_file_roads ;
    the_graph <- as_edge_graph(road);
    
    create supplier from: shape_file_supplier;
    create centre_logistique from: shape_file_centre_logistique;
    
    create image_legende number:1{
    	location<-{world.shape.width*0.1,world.shape.height*0.9};
    }
    
  
        
    list<building> residential_buildings <- building where (each.type="RÃ©sidentiel");
    list<building> industrial_buildings <- building  where (each.type="Industriel" or each.type="Commercial et services" or each.type="Commerce nouveau") ;
    create people number: nb_people {
        speed <- rnd(min_speed, max_speed)/2;
        start_work <- rnd (min_work_start, max_work_start);
        end_work <- rnd(min_work_end, max_work_end);
        living_place <- one_of(supplier) ;
        working_place <- one_of(centre_logistique) ;
        objective <- "resting";
        location <- any_location_in (living_place); 
    }
    create people_2 number: nb_people_2 {
        speed <- rnd(min_speed_2, max_speed_2)/1.5;
        start_work <- rnd (min_work_start_2, max_work_start_2);
        end_work <- rnd(min_work_end_2, max_work_end_2);
        living_place <- one_of(centre_logistique) ;
        working_place <- one_of(industrial_buildings) ;
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

species image_legende {
	aspect base {
		draw square(100) color:#white;
		draw image_file (image1) size:{100#px, 100#px} rotate:90 ;
	}
}

species centre_logistique parent:building {
    string type; 
    rgb color <- #purple  ;
    
    aspect base {
    draw shape color: color ;
    }
}


species supplier parent:building {
    string type; 
    rgb color <- #blue  ;
    
    aspect base {
    draw shape color: color ;
    }
}

species road  {
    rgb color <- #black ;
    aspect base {
    draw shape color: color ;
    }
}

species people skills:[moving] {
    rgb color <- #black ;
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
        color <- #white ;
    }
    }
    
    aspect base {
    draw rectangle(5,10) color: color border: #black rotate:heading+90;
    }
}

species people_2 skills:[moving] {
    rgb color <- #green ;
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
    }
    }
    
    aspect base {
    draw triangle(10) color: color border: #green rotate:heading+90;
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
        species people aspect: base ;
        species supplier aspect: base ;
        species centre_logistique aspect: base;
        species people_2 aspect: base ;
        species image_legende aspect: base;
    }
    }
}
