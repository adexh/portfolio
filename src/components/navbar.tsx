import { ExternalLink } from 'lucide-react'

const Menus = [{
  menu: "Home",
  link: "#herosection"
},
{
  menu: "Experience",
  link: "#expsection"
},
{
  menu: "Projects",
  link: "#projectsection"
},
{
  menu: "Blog",
  link: "https://vault.devrealm.in"
}
];

export default function Navbar() {
  const handleScroll = (event: React.MouseEvent, link: string) => {
    event.preventDefault();
    
    if( link.includes('https') ){
      window.open(link, '_blank');
      return;
    }
    const targetElement = document.querySelector(link);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky -mt-10 top-0 z-50 flex justify-center items-center">
      <div className="mt-1 p-2 ring-gray-800 rounded-3xl backdrop-blur-lg ring-1 backdrop-brightness-50">
        {Menus.map((menu, index) => (
          <a key={index} href={menu.link} className="text-gray-400 text-sm hover:text-gray-300 px-4 py-2"
            onClick={e=> handleScroll(e,menu.link)}
          >
            {menu.menu}
            {menu.link.includes('https') && <ExternalLink className="inline ml-1" size={12} />}
          </a>
        ))}
      </div>
    </nav>
  )
}