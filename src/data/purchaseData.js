// 1000+ Indian names with cities for purchase notifications
export const generatePurchaseData = () => {
    const firstNames = [
        'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Arnav', 'Ayaan', 'Krishna', 'Ishaan',
        'Shaurya', 'Atharv', 'Advik', 'Pranav', 'Advait', 'Dhruv', 'Kabir', 'Shivansh', 'Reyansh', 'Kiaan',
        'Ananya', 'Diya', 'Pari', 'Aadhya', 'Sara', 'Anvi', 'Aaradhya', 'Navya', 'Angel', 'Saanvi',
        'Prisha', 'Avni', 'Myra', 'Anika', 'Riya', 'Shanaya', 'Ira', 'Anaya', 'Ishita', 'Siya',
        'Rajesh', 'Amit', 'Rahul', 'Rohit', 'Suresh', 'Ramesh', 'Mahesh', 'Dinesh', 'Rakesh', 'Naresh',
        'Priya', 'Pooja', 'Sneha', 'Kavya', 'Neha', 'Ritu', 'Anjali', 'Swati', 'Preeti', 'Madhuri',
        'Vikram', 'Karan', 'Varun', 'Rohan', 'Nikhil', 'Akash', 'Vishal', 'Manish', 'Pankaj', 'Deepak',
        'Simran', 'Divya', 'Shruti', 'Megha', 'Nisha', 'Pallavi', 'Shweta', 'Komal', 'Ruchi', 'Sonal',
        'Ajay', 'Vijay', 'Sanjay', 'Manoj', 'Anil', 'Sunil', 'Ashok', 'Vinod', 'Prakash', 'Santosh',
        'Rani', 'Geeta', 'Seema', 'Rekha', 'Sunita', 'Savita', 'Kamala', 'Usha', 'Lata', 'Meena'
    ];

    const lastNames = [
        'Kumar', 'Singh', 'Sharma', 'Patel', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Mehta',
        'Desai', 'Joshi', 'Shah', 'Agarwal', 'Verma', 'Mishra', 'Pandey', 'Tiwari', 'Yadav', 'Chauhan',
        'Malhotra', 'Kapoor', 'Chopra', 'Khanna', 'Bhatia', 'Sethi', 'Arora', 'Sood', 'Bajaj', 'Tandon',
        'Menon', 'Pillai', 'Krishnan', 'Raman', 'Subramanian', 'Venkatesh', 'Narayanan', 'Srinivasan', 'Balakrishnan', 'Ramachandran',
        'Das', 'Bose', 'Ghosh', 'Chatterjee', 'Banerjee', 'Mukherjee', 'Roy', 'Sen', 'Dutta', 'Chakraborty'
    ];

    const cities = [
        'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur',
        'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Pimpri', 'Patna', 'Vadodara',
        'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan', 'Vasai', 'Varanasi',
        'Srinagar', 'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad', 'Ranchi', 'Howrah', 'Coimbatore', 'Jabalpur',
        'Gwalior', 'Vijayawada', 'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati', 'Solapur', 'Hubli'
    ];

    const brands = [
        'Dior', 'Chanel', 'Gucci', 'Tom Ford', 'Versace', 'Yves Saint Laurent', 'Prada', 'Burberry', 'Calvin Klein', 'Lancôme',
        'Giorgio Armani', 'Dolce & Gabbana', 'Hermès', 'Givenchy', 'Bvlgari', 'Valentino', 'Carolina Herrera', 'Marc Jacobs', 'Viktor & Rolf', 'Thierry Mugler',
        'Jean Paul Gaultier', 'Paco Rabanne', 'Montblanc', 'Hugo Boss', 'Davidoff', 'Azzaro', 'Issey Miyake', 'Kenzo', 'Diesel', 'Lacoste'
    ];

    const products = [
        'Sauvage', 'Coco Mademoiselle', 'Bloom', 'Black Orchid', 'Eros', 'Black Opium', 'Luna Rossa', 'Her', 'Eternity', 'La Vie Est Belle',
        'Acqua di Gio', 'Light Blue', 'J\'adore', 'Miss Dior', 'Guilty', 'The One', 'Good Girl', 'Daisy', 'Flowerbomb', 'Angel',
        'Le Male', 'Invictus', 'Legend', 'The Scent', 'Cool Water', 'Chrome', 'L\'Eau d\'Issey', 'Flower', 'Only The Brave', 'L\'Homme'
    ];

    const images = [
        'https://images.unsplash.com/photo-1541643600914-78b084683601?w=100',
        'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=100',
        'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=100',
        'https://images.unsplash.com/photo-1588405748880-12d1d2a59d75?w=100',
        'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=100',
        'https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=100',
        'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=100'
    ];

    // Generate 1000+ unique combinations
    const purchases = [];
    let id = 0;

    for (let i = 0; i < firstNames.length && id < 1000; i++) {
        for (let j = 0; j < lastNames.length && id < 1000; j++) {
            const name = `${firstNames[i]} ${lastNames[j]}`;
            const city = cities[Math.floor(Math.random() * cities.length)];
            const brand = brands[Math.floor(Math.random() * brands.length)];
            const product = products[Math.floor(Math.random() * products.length)];
            const image = images[Math.floor(Math.random() * images.length)];

            purchases.push({ name, city, brand, product, image });
            id++;
        }
    }

    return purchases;
};
