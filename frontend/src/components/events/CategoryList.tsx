import { useNavigate } from 'react-router-dom';

const categories = [
  { name: 'Music', icon: 'music.png' },
  { name: 'Nightlife', icon: 'nightlife.png' },
  { name: 'Performing & Visual Arts', icon: 'visual.png' },
  { name: 'Holidays', icon: 'holiday.png' },
  { name: 'Dating', icon: 'dating.png' },
  { name: 'Hobbies', icon: 'hobby.png' },
  { name: 'Business', icon: 'business.png' },
  { name: 'Food & Drinks', icon: 'food.png' },
];

const CategoryList = () => {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    navigate(`/find-events?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div className="py-6">
      <div className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className="category-item group"
          >
            <div className="category-icon">
              <img src={`/${category.icon}`} alt={category.name} className="w-8 h-8 md:w-12 md:h-12 object-contain" />
            </div>
            <span className="text-[14px] text-center text-foreground group-hover:text-[#F15537] transition-colors line-clamp-2 ">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;