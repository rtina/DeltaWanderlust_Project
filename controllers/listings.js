const Listing = require("../models/listing.js");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const apiKey = process.env.MAPTILER_API_KEY;



module.exports.index = async (req,res) => {
    const allListings = await Listing.find({});
    res.render("listings/index.ejs",{allListings});
}

module.exports.renderNewForm = (req,res)=>{
    res.render("listings/new.ejs");
}

module.exports.showListing = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id).populate({path : "reviews" , populate :{path : "author"}}).populate("owner");
    if(!listing){
        req.flash("error", "Listing not found");
        return res.redirect("/listings") ; 
    }
    const coords = listing.geometry ? listing.geometry.coordinates : [75.3433, 19.8762];
    res.render("listings/show.ejs", ({listing , apiKey , coordinates : coords}));
}

module.exports.createListing = async (req,res,next)=>{

    const apiKey = process.env.MAPTILER_API_KEY;
    const location = req.body.listing.location;

    const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(location)}.json?key=${apiKey}`);
    const data = await response.json();

    if (!data.features.length) {
        req.flash("error", "Location not found");
        return res.redirect("/listings/new");
    }

    // let {title,description, price ,image , country ,location} = req.body
        let url = req.file.path;
        let filename = req.file.filename;
        const newlist = new Listing(req.body.listing);
        newlist.owner = req.user._id;
        newlist.image = {url, filename};
        newlist.geometry = {
            type: "Point",
            coordinates: data.features[0].geometry.coordinates
        };
        let savedListing = await newlist.save();
        console.log(savedListing);
        req.flash("success", "Successfully made a new listing");
        res.redirect("/listings");  
}

module.exports.renderEditForm = async (req,res)=>{
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error", "Listing not found");
        return res.redirect("/listings") ;
    }
    let originalImageUrl = listing.image.url;
    originalImageUrl = originalImageUrl.replace("/upload", "/upload/h_250,w_250");
    res.render("listings/edit.ejs" , {listing , originalImageUrl});
}

module.exports.updateListing = async(req,res)=>{
    let {id} = req.params;
     let listing = await Listing.findByIdAndUpdate(id,{...req.body.listing});
     if(typeof req.file !== "undefined"){
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = {url, filename};
        await listing.save();
     }
     req.flash("success", "Listing updated" );
     res.redirect(`/listings/${id}`);
}

module.exports.destroyListing = async (req,res)=>{
    let {id} = req.params;
    let deletedlist = await Listing.findByIdAndDelete(id);
    console.log(deletedlist);
    req.flash("success", "Successfully deleted Listing" );
    res.redirect("/listings");
}