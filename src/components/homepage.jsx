import './homepage.css'
import Navbar from './navbar';

function Homepage() {
    document.body.style = { background: '#000000' };
    return (
        <div>
            <Navbar />
            <div class='ellipsesparent'>
                <img src="\ellipses1.png" id='ellipses1' alt="styling-ellipse"/>
                <img src="\ellipses2.png" id='ellipses2' alt="styling-ellipse"/>
                <img src='\ellipses3.png' id='ellipses3' alt="styling-ellipse"/>
            </div>
            <div>
                <div class='rec-1-home'></div>
                <div class='rec-2-home'></div>
                <div class='rec-3-home'></div>
                <div class='text-box-home'>
                    <span class='home-intro-big'>Hi I am,<br />Adesh Tamrakar</span>
                    <span class='home-intro-small'>I'm a full-stack web developer skilled in ReactJs, Angular, NodeJs, RDBMS, NoSQL and AWS. From interactive user interfaces to performant backends, I create seamless web solutions.<br /><br />Let's elevate your online presence with expertise and a relentless pursuit of excellence.</span>
                </div>
            </div>
        </div>
    )
}

export default Homepage;