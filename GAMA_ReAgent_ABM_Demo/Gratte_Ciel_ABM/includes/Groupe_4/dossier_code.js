# simulation 1

/**
* Name: Modelvilleurbanne
* Based on the internal empty template. 
* Author: monir
* Tags: 
*/


model Modelvilleurbanne

/* Insert your model definition here */

/* on commence par définir les fichiers qui vont servir au model */
global {
    file shape_file_buildings <- file("C:/Users/monir/Documents/projet_villeurbanne/batiments.shp"); 
    file shape_file_roads <- file("C:/Users/monir/Documents/projet_villeurbanne/reso_electrique_clean.shp");
    file shape_file_bounds <- file("C:/Users/monir/Documents/projet_villeurbanne/limite_zone.shp"); 
    geometry shape <- envelope(shape_file_bounds); /* definit emprise du modèle */
    float step <- 0.1 #mn; /* le temps */
    date starting_date <- date("2019-09-01-00-00-00");
    int nb_people <- 33;
    int min_work_start <- 6;
    int max_work_start <- 8;
    int min_work_end <- 16; 
    int max_work_end <- 20; 
    float min_speed <- 0.1 #km / #h;
    float max_speed <- 0.3 #km / #h; 
    graph the_graph;
        
    init {
    create batiments from: shape_file_buildings with: [type::string(read ("etat_bati"))] {
        if type="Nouveaux bâts" {
        color <- #blue ;
        }
        if type="Anciens Bât" { 
        color <- #gray ;
        }
    }
    create reso_electrique from: shape_file_roads ;
    the_graph <- as_edge_graph(reso_electrique);

    
    
    list<batiments> nouveau_batis <- batiments where (each.type="Nouveaux bâts");
    list<batiments> anciens_batis <- batiments  where (each.type="Anciens Bât"); 
	create people number: nb_people {
        speed <- rnd(min_speed, max_speed);
        start_work <- rnd (min_work_start, max_work_start);
        end_work <- rnd(min_work_end, max_work_end);
        living_place <- one_of(nouveau_batis) ;
        working_place <- one_of(anciens_batis) ;
        objective <- "resting";
        location <- any_location_in (living_place);
        location <- one_of(the_graph.vertices);

    }
      
   }
   
}

species batiments {
    string type; 
    rgb color <- #gray  ;
    
    aspect base {
    draw shape color: color ;
    }
}

species reso_electrique  {
    rgb color <- #red ;
    aspect base {
    draw shape color: color ;
    }
}

species people skills:[moving] {
    rgb color <- #yellow ;
    batiments living_place <- nil ;
    batiments working_place <- nil ;
    int start_work ;
    int end_work  ;
    string objective ; 
    point the_target <- nil ;
        
    reflex time_to_work when: current_date.hour = start_work and objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    }
    
        reflex time_to_work when: objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    the_target <- one_of(the_graph.vertices);
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
    draw circle(10) color: color border: #black;
    }
}
 

 /* intégrer l'experiment */
 
 
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
    display city_display type: opengl {
        species batiments aspect: base ;
        species reso_electrique aspect: base ;
        species people aspect: base ;
    }
    }
}





# simulation 2

/**
* Name: simulation2
* Based on the internal empty template. 
* Author: monir
* Tags: 
*/


model simulation2

/* Insert your model definition here */

/* Insert your model definition here */

/* on commence par définir les fichiers qui vont servir au model */
global {
    file shape_file_buildings <- file("C:/Users/monir/Documents/projet_villeurbanne/batiments.shp"); 
    file shape_file_roads <- file("C:/Users/monir/Documents/projet_villeurbanne/reso_electrique_clean.shp");
    file shape_file_bounds <- file("C:/Users/monir/Documents/projet_villeurbanne/limite_zone.shp");
    file shape_file_pt <- file("C:/Users/monir/Documents/projet_villeurbanne/post_transformation.shp");  
    geometry shape <- envelope(shape_file_bounds); /* definit emprise du modèle */
    float step <- 0.1 #mn; /* le temps */
    date starting_date <- date("2019-09-01-00-00-00");
    int nb_people <- 100;
    int min_work_start <- 6;
    int max_work_start <- 8;
    int min_work_end <- 16; 
    int max_work_end <- 20; 
    float min_speed <- 0.1 #km / #h;
    float max_speed <- 0.3 #km / #h; 
    graph the_graph;
        
    init {
    create batiments from: shape_file_buildings with: [type::string(read ("etat_bati"))] {
        if type="Nouveaux bâts" {
        color <- #gray ;
        }
        if type="Anciens Bât" { 
        color <- #gray ;
        }
    }
    create reso_electrique from: shape_file_roads ;
    the_graph <- as_edge_graph(reso_electrique);
	
	create post_transformation from: shape_file_pt;
    
    
    list<batiments> nouveau_batis <- batiments where (each.type="Nouveaux bâts");
    list<batiments> anciens_batis <- batiments  where (each.type="Anciens Bât"); 
    
	create people number: nb_people {
        speed <- rnd(min_speed, max_speed);
        start_work <- rnd (min_work_start, max_work_start);
        end_work <- rnd(min_work_end, max_work_end);
        living_place <- one_of(post_transformation) ;
        working_place <- one_of(batiments) ;
        objective <- "resting";
        location <- any_location_in (living_place);
  //      location <- one_of(the_graph.vertices);

    }
      
   }
   
}

species batiments {
    string type; 
    rgb color <- #gray  ;
    
    aspect base {
    draw shape color: color ;
    }
}

species reso_electrique  {
    rgb color <- #red ;
    aspect base {
    draw shape color: color ;
    }
}


species post_transformation  {
    rgb color <- #red ;
    aspect base {
    draw circle(10) color: color border: #red;
    }
}


species people skills:[moving] {
    rgb color <- #red ;
    post_transformation living_place <- nil ;
    batiments working_place <- nil ;
    int start_work ;
    int end_work  ;
    string objective ; 
    point the_target <- nil ;
        
    reflex time_to_work when: current_date.hour = start_work and objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    }
    
        reflex time_to_work when: objective = "resting"{
    objective <- "working" ;
    the_target <- any_location_in (working_place);
    the_target <- one_of(the_graph.vertices);
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
    draw circle(10) color: color border: #black;
    }
}
 

 /* intégrer l'experiment */
 
 
experiment road_traffic type: gui {
    parameter "Shapefile for the buildings:" var: shape_file_buildings category: "GIS" ;
    parameter "Shapefile for the roads:" var: shape_file_roads category: "GIS" ;
    parameter "Shapefile for the bounds:" var: shape_file_bounds category: "GIS" ; 
    parameter "Shapefile for the point:" var: shape_file_pt category: "GIS" ;  
    parameter "Number of people agents" var: nb_people category: "People" ;
    parameter "Earliest hour to start work" var: min_work_start category: "People" min: 2 max: 8;
    parameter "Latest hour to start work" var: max_work_start category: "People" min: 8 max: 12;
    parameter "Earliest hour to end work" var: min_work_end category: "People" min: 12 max: 16;
    parameter "Latest hour to end work" var: max_work_end category: "People" min: 16 max: 23;
    parameter "minimal speed" var: min_speed category: "People" min: 0.01 #km/#h ;
    parameter "maximal speed" var: max_speed category: "People" max: 10 #km/#h;
    
    output {
    display city_display type: opengl rotate:90{
        species batiments aspect: base ;
        species reso_electrique aspect: base ;
        species people aspect: base ;
        species post_transformation aspect: base;
    }
    }
}